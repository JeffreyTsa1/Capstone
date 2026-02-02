


from dataclasses import dataclass
import os
import time
import asyncio
import aiohttp
from dotenv import load_dotenv
from pymongo import MongoClient
from flask import jsonify
from datetime import datetime
from utils.geo import generate_points_grid
from utils.externalapi import pm25_to_aqi
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict

if os.path.exists(".env.local"):
    load_dotenv(dotenv_path=".env.local")
else:
    load_dotenv()  # fallback to .env

cluster = os.getenv("MONGO_CLUSTER_URL")
openWeatherApiKey = os.getenv("OPENWEATHER_API_KEY")
client = MongoClient(cluster)
db = client.Fireflare

aqiCollection = db.openWeatherAQIData

@dataclass
class AQIReading:
    lat: float
    lon: float
    timestamp: str
    zone: str
    priority: int
    aqi: Optional[int] = None  # EPA AQI (0-500 scale)
    openweather_aqi: Optional[int] = None  # OpenWeather AQI (1-5 scale)
    pm25_concentration: Optional[float] = None  # PM2.5 µg/m³
    components: Optional[Dict] = None
    success: bool = False
    error: Optional[str] = None



class AQIFetcher:
    def __init__(self, api_key: str, batch_size: int = 50, delay_ms: int = 100):
        self.api_key = api_key
        self.batch_size = batch_size
        self.delay_ms = delay_ms
        self.base_url = "http://api.openweathermap.org/data/2.5/air_pollution"
    
    async def fetch_aqi(self, session: aiohttp.ClientSession, lat: float, lon: float) -> Dict:
        """Fetch AQI data for a single point."""
        url = f"{self.base_url}?lat={lat}&lon={lon}&appid={self.api_key}"
        
        try:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    components = data['list'][0]['components']
                    openweather_aqi = data['list'][0]['main']['aqi']  # 1-5 scale
                    
                    # Extract PM2.5 concentration (µg/m³) and convert to EPA AQI
                    pm25_concentration = components.get('pm2_5')
                    epa_aqi = None
                    
                    if pm25_concentration is not None:
                        epa_aqi = pm25_to_aqi(pm25_concentration)
                    
                    return {
                        'aqi': epa_aqi,  # EPA AQI (0-500 scale)
                        'openweather_aqi': openweather_aqi,  # Keep original 1-5 scale
                        'pm25_concentration': pm25_concentration,  # Raw PM2.5 µg/m³
                        'components': components,
                        'success': True
                    }
                else:
                    return {
                        'success': False,
                        'error': f"HTTP {response.status}"
                    }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    async def process_batch(self, session: aiohttp.ClientSession, points: List[Dict]) -> List[AQIReading]:
        """Process a batch of points."""
        results = []
        
        for i, point in enumerate(points):
            # print(f"  Processing {i + 1}/{len(points)}: {point.lat:.4f}, {point.lon:.4f}")
            
            result = await self.fetch_aqi(session, point.lat, point.lon)
            
            reading = AQIReading(
                lat=point.lat,
                lon=point.lon,
                timestamp=datetime.now().isoformat() + 'Z',
                zone=point.zone,
                priority=point.priority,
                aqi=result.get('aqi'),  # EPA AQI
                openweather_aqi=result.get('openweather_aqi'),  # 1-5 scale
                pm25_concentration=result.get('pm25_concentration'),  # µg/m³
                components=result.get('components'),
                success=result['success'],
                error=result.get('error')
            )
            
            results.append(reading)
            
            # Rate limiting
            if i < len(points) - 1:
                await asyncio.sleep(self.delay_ms / 1000)
        
        return results
    
    async def fetch_all(self, grid_points: List[Dict]) -> List[AQIReading]:
        """Fetch AQI for all grid points."""
        start_time = time.time()
        all_results = []
        
        async with aiohttp.ClientSession() as session:
            # Process in batches
            for i in range(0, len(grid_points), self.batch_size):
                batch = grid_points[i:i + self.batch_size]
                batch_num = i // self.batch_size + 1
                total_batches = (len(grid_points) + self.batch_size - 1) // self.batch_size
                
                print(f"\nBatch {batch_num}/{total_batches}")
                
                batch_results = await self.process_batch(session, batch)
                all_results.extend(batch_results)
                
                # Progress update
                progress = ((i + len(batch)) / len(grid_points) * 100)
                print(f"Progress: {progress:.1f}%")
        
        elapsed = time.time() - start_time
        print(f"\n✅ Complete!")
        print(f"Time taken: {elapsed / 60:.1f} minutes")
        
        return all_results
    

def store_results(results: List[AQIReading]):
    
    # Try to store results to Database
    try:
        # Check if we have recent data in the database

        latest_data_cursor = aqiCollection.find({}).sort([("lastUpdated", -1)]).limit(1)
        latest_data = None
        for doc in latest_data_cursor:
            latest_data = doc
            break
    
        current_time = datetime.now()
        should_fetch_new = True
        if latest_data:
            last_updated = latest_data.get("lastUpdated")
            if isinstance(last_updated, str):
                last_updated = datetime.fromisoformat(last_updated)
            elif isinstance(last_updated, datetime):
                pass  # Already a datetime object
            else:
                last_updated = datetime.min  # Force update if invalid format
            print(f"Last updated: {last_updated}, Current time: {current_time}")
            
            # Check if data is less than 4 hours old (adjust as needed)
            time_diff = current_time - last_updated
            if time_diff.total_seconds() < 14400:  # 4 hours in seconds
                should_fetch_new = False
                print("Using cached AQI data from database")
                return {'status_code': 200, 'message': 'Using cached data'}
        
        if should_fetch_new:
            print("Fetching fresh AQI data from OpenWeather API")

            # Convert AQIReading objects to GeoJSON FeatureCollection
            features = []
            successful_count = 0
            
            for reading in results:
                # Only include successful readings with valid AQI
                if not reading.success or reading.aqi is None:
                    continue
                    
                # Create GeoJSON feature
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point", 
                        "coordinates": [reading.lon, reading.lat]
                    },
                    "properties": {
                        "aqi": reading.aqi,  # EPA AQI (0-500 scale)
                        "openweather_aqi": reading.openweather_aqi,  # 1-5 scale
                        "pm25_concentration": reading.pm25_concentration,  # µg/m³
                        "components": reading.components or {},
                        "zone": reading.zone,
                        "priority": reading.priority,
                        "timestamp": reading.timestamp,
                        "success": reading.success,
                        "error": reading.error
                    }
                }
                features.append(feature)
                successful_count += 1
            
            # Create GeoJSON FeatureCollection
            geojson_data = {
                "type": "FeatureCollection",
                "features": features,
                "metadata": {
                    "source": "Open Weather Air Pollution API",
                    "totalReadings": len(results),
                    "successfulReadings": successful_count,
                    "gridGenerationInfo": "Generated from wildfire zones"
                }
            }
            
            # Store both versions in the database
            new_aqi_doc = {
                "lastUpdated": current_time.isoformat(),
                "originalData": geojson_data,  # GeoJSON FeatureCollection
                "rawReadings": [asdict(reading) for reading in results],  # Keep raw data as backup
                "source": "Open Weather Air Pollution API",
                "fetchedAt": current_time.isoformat()
            }
            
            # Insert new data (keep all historical entries as backup)
            response_after_insert = aqiCollection.insert_one(new_aqi_doc)
            if response_after_insert.acknowledged:
                print(f"Inserted GeoJSON with {len(features)} features (ID: {response_after_insert.inserted_id})")
                return {'status_code': 200, 'message': 'GeoJSON data stored successfully'}
            else:
                print("❌ Failed to insert new AQI data!")
                return {'status_code': 500, 'message': 'Failed to insert data'}

    except Exception as e:
        print(f"❌ Failed to store data into database! Error: {e}")
        return {'status_code': 500, 'message': f'Database error: {str(e)}'}



async def main():
    """Main function."""
    print("=" * 60)
    print("WILDFIRE AQI DATA FETCHER")
    print("=" * 60)
    
    # Load environment variables
    api_key = openWeatherApiKey    
    if not api_key:
        print("❌ OPENWEATHER_API_KEY not set in environment variables!")
        return 
    # Generate Grid
    grid_points = generate_points_grid()
    # Fetch AQI data
    fetcher = AQIFetcher(api_key, batch_size=50, delay_ms=100)
    results = await fetcher.fetch_all(grid_points)
    
    # Save results
    response = store_results(results)
    
    if response['status_code'] == 200:
        print("✅ Results successfully stored in database!")
    else:
        print(f"❌ Failed to store results: {response['status_code']} - {response['message']}")

    # Summary
    successful = sum(1 for r in results if r.success)
    print(f"\n" + "=" * 60)
    print(f"SUMMARY:")
    print(f"=" * 60)
    print(f"Total points: {len(results)}")
    print(f"Successful: {successful}")
    print(f"Failed: {len(results) - successful}")
    print(f"Success rate: {successful / len(results) * 100:.1f}%")

if __name__ == '__main__':
    asyncio.run(main())
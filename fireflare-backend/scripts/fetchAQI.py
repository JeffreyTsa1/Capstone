


from dataclasses import dataclass
import os
import time
import asyncio
import aiohttp
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict

cluster = os.getenv("MONGO_CLUSTER_URL")
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
    aqi: Optional[int] = None
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
                    return {
                        'aqi': data['list'][0]['main']['aqi'],
                        'components': data['list'][0]['components'],
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
            print(f"  Processing {i + 1}/{len(points)}: {point['lat']:.4f}, {point['lon']:.4f}")
            
            result = await self.fetch_aqi(session, point['lat'], point['lon'])
            
            reading = AQIReading(
                lat=point['lat'],
                lon=point['lon'],
                timestamp=datetime.utcnow().isoformat() + 'Z',
                zone=point['zone'],
                priority=point['priority'],
                aqi=result.get('aqi'),
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
    

async def store_results(results: List[AQIReading]):
    
    # Try to store results to Database
    try:
        # Check if we have recent data in the database

        latest_data_cursor = aqiCollection.find({}).sort([("lastUpdated", -1)]).limit(1)
        latest_data = None
        for doc in latest_data_cursor:
            latest_data = doc
            break
    
        current_time = datetime.datetime.now()
        should_fetch_new = True
        if latest_data:
            last_updated = latest_data.get("lastUpdated")
            if isinstance(last_updated, str):
                last_updated = datetime.datetime.fromisoformat(last_updated)
            elif isinstance(last_updated, datetime.datetime):
                pass  # Already a datetime object
            else:
                last_updated = datetime.datetime.min  # Force update if invalid format
            print(f"Last updated: {last_updated}, Current time: {current_time}")
            
            # Check if data is less than 4 hours old (adjust as needed)
            time_diff = current_time - last_updated
            if time_diff.total_seconds() < 14400:  # 4 hours in seconds
                should_fetch_new = False
                print("Using cached wildfire data from database")
                
                # Return cached clustered data (for performance) 
                # Check for new data structure first, fallback to old structure
                if "clusteredData" in latest_data:
                    geojson_data = latest_data["clusteredData"]
                    print(f"Returning cached clustered data with {len(geojson_data.get('features', []))} features")
                elif "geojsonData" in latest_data:
                    # Legacy data - apply clustering on-the-fly
                    print("Legacy data detected - applying clustering on-the-fly...")
                    legacy_geojson = latest_data["geojsonData"]
                    legacy_features = legacy_geojson.get("features", [])
                    
                    if len(legacy_features) > 1 and clustering_config['enable_clustering']:
                        clustered_features = cluster_geojson_points(
                            legacy_features, 
                            clustering_config['cluster_distance_km']
                        )
                        print(f"Applied clustering: {len(legacy_features)} → {len(clustered_features)} features")
                        geojson_data = {
                            "type": "FeatureCollection",
                            "features": clustered_features
                        }
                    else:
                        geojson_data = legacy_geojson
                        print("Using legacy data without clustering")
                else:
                    # No data found
                    geojson_data = {
                        "type": "FeatureCollection", 
                        "features": []
                    }
                    print("No data found - returning empty collection")
                
                return jsonify(geojson_data), 200, {'Content-Type': 'application/json'}
        
        if should_fetch_new:
            print("Fetching fresh wildfire data from NASA API")

            
            # Store both versions in the database
            new_aqi_doc = {
                "lastUpdated": current_time.isoformat(),
                "originalData": nasa_data["original"],          # Full NASA data
                "source": "Open Weather Air Pollution API",
                "fetchedAt": current_time.isoformat()
            }
            
            # Insert new data (keep all historical entries as backup)
            nasaWildfiresCollection.insert_one(wildfire_document)
            print(f"Updated wildfire database with {nasa_data['original_count']} original features, {nasa_data['clustered_count']} clustered features")
            
            # Return the clustered data to the client (optimized payload)
            return jsonify(nasa_data["clustered"]), 200, {'Content-Type': 'application/json'}
            

    except:
        print(f"❌ Failed to store data into database!")



async def main():
    """Main function."""
    print("=" * 60)
    print("WILDFIRE AQI DATA FETCHER")
    print("=" * 60)
    
    # Load environment variables
    api_key = os.getenv('OPENWEATHER_API_KEY')
    if not api_key:
        raise ValueError("OPENWEATHER_API_KEY environment variable not set!")
    
    # Load grid
    grid_path = Path('grid/wildfire_grid.json')
    if not grid_path.exists():
        raise FileNotFoundError(f"Grid file not found: {grid_path}")
    
    with open(grid_path) as f:
        grid_data = json.load(f)
    
    grid_points = grid_data['points']
    print(f"Loaded {len(grid_points)} grid points")
    print(f"Distribution: {grid_data.get('distribution', {})}")
    
    # Fetch AQI data
    fetcher = AQIFetcher(api_key, batch_size=50, delay_ms=100)
    results = await fetcher.fetch_all(grid_points)
    
    # Save results
    response = store_results(results)
    
    if response.status_code == 200:
        print("✅ Results successfully stored in database!")
    else:
        print(f"❌ Failed to store results: {response.status_code} - {response.text}")

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
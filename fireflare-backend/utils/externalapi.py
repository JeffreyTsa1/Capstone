import requests
import csv
import os 
from io import StringIO
from dotenv import load_dotenv
from pathlib import Path
import math

# Find .env.local file - try multiple locations
current_file = Path(__file__)
env_paths = [
    current_file.parent.parent / '.env.local',  # fireflare-backend/.env.local
    current_file.parent.parent.parent / '.env.local',  # ../.env.local
]

env_loaded = False
for env_path in env_paths:
    if env_path.exists():
        print(f"Loading .env file from: {env_path}")
        load_dotenv(env_path)
        env_loaded = True
        break

if not env_loaded:
    print("Warning: Could not find .env.local file")
    print("Searched paths:")
    for path in env_paths:
        print(f"  - {path}")

OPENAQ_BASE = os.getenv("OPEN_AQ_BASE")
OPENAQ_API_KEY = os.getenv("OPEN_AQ_API_KEY")

# Debug output
# print(f"OPENAQ_BASE: {OPENAQ_BASE}")
# print(f"OPENAQ_API_KEY loaded: {OPENAQ_API_KEY is not None}")
# if OPENAQ_API_KEY:
#     print(f"OPENAQ_API_KEY starts with: {OPENAQ_API_KEY[:10]}...")
# print(f"Current working directory: {os.getcwd()}")
# print(f"Script location: {current_file}")



def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance between two points on Earth in kilometers."""
    R = 6371  # Earth's radius in kilometers
    
    # Convert latitude and longitude to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def cluster_geojson_points(features, cluster_distance_km=5.0):
    """
    Cluster nearby GeoJSON points together to reduce data size.
    
    Args:
        features: List of GeoJSON features with Point geometries
        cluster_distance_km: Distance threshold in kilometers for clustering
    
    Returns:
        List of clustered features with aggregated properties
    """
    if not features:
        return features
    
    clusters = []
    used_indices = set()
    
    for i, feature in enumerate(features):
        if i in used_indices:
            continue
            
        # Start a new cluster with this feature
        cluster_features = [feature]
        used_indices.add(i)
        
        lat1 = feature["geometry"]["coordinates"][1]
        lon1 = feature["geometry"]["coordinates"][0]
        
        # Find all nearby features to add to this cluster
        for j, other_feature in enumerate(features):
            if j in used_indices:
                continue
                
            lat2 = other_feature["geometry"]["coordinates"][1]
            lon2 = other_feature["geometry"]["coordinates"][0]
            
            if haversine_distance(lat1, lon1, lat2, lon2) <= cluster_distance_km:
                cluster_features.append(other_feature)
                used_indices.add(j)
        
        # Create clustered feature
        if len(cluster_features) == 1:
            # Single point, no clustering needed
            clusters.append(cluster_features[0])
        else:
            # Multiple points, create cluster
            cluster = create_cluster_feature(cluster_features)
            clusters.append(cluster)
    
    return clusters

def create_cluster_feature(features):
    """
    Create a single clustered feature from multiple nearby features.
    Uses centroid for coordinates and aggregates properties.
    """
    if len(features) == 1:
        return features[0]
    
    # Calculate centroid
    total_lat = sum(f["geometry"]["coordinates"][1] for f in features)
    total_lon = sum(f["geometry"]["coordinates"][0] for f in features)
    centroid_lat = total_lat / len(features)
    centroid_lon = total_lon / len(features)
    
    # Aggregate properties
    cluster_properties = {
        "cluster_size": len(features),
        "cluster_type": "wildfire_cluster"
    }
    
    # For numeric properties, calculate averages
    numeric_props = ["brightness", "bright_t31", "frp", "confidence"]
    for prop in numeric_props:
        values = []
        for feature in features:
            if prop in feature["properties"]:
                try:
                    values.append(float(feature["properties"][prop]))
                except (ValueError, TypeError):
                    continue
        
        if values:
            cluster_properties[f"avg_{prop}"] = round(sum(values) / len(values), 2)
            cluster_properties[f"max_{prop}"] = round(max(values), 2)
            cluster_properties[f"min_{prop}"] = round(min(values), 2)
    
    # For categorical properties, collect unique values
    categorical_props = ["satellite", "instrument", "version", "track", "type"]
    for prop in categorical_props:
        unique_values = set()
        for feature in features:
            if prop in feature["properties"] and feature["properties"][prop]:
                unique_values.add(str(feature["properties"][prop]))
        
        if unique_values:
            cluster_properties[prop] = list(unique_values)
    
    # Keep latest acquisition date/time
    acq_dates = []
    for feature in features:
        if "acq_date" in feature["properties"]:
            acq_dates.append(feature["properties"]["acq_date"])
    
    if acq_dates:
        cluster_properties["latest_acq_date"] = max(acq_dates)
        cluster_properties["earliest_acq_date"] = min(acq_dates)
    
    return {
        "type": "Feature",
        "geometry": {
            "type": "Point",
            "coordinates": [centroid_lon, centroid_lat]
        },
        "properties": cluster_properties
    }

def fetch_nasa_geojson(map_key, source, bbox, days, enable_clustering=True, cluster_distance_km=5.0, return_both=False):
    base_url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
    coords = ",".join(map(str, bbox))  # [west, south, east, north]
    url = f"{base_url}/{map_key}/{source}/{coords}/{days}/"
    print(f"Fetching NASA data from: {url}")
    
    original_features = []
    response = requests.get(url, timeout=15)

    if not response.ok:
        raise RuntimeError(f"NASA API error: {response.status_code}")
    
    f = StringIO(response.text.lstrip("\ufeff"))  # strip BOM if present
    reader = csv.DictReader(f)

    for row in reader:
        try:
            lat = float(row["latitude"])
            lon = float(row["longitude"])
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [lon, lat]
                },
                "properties": {
                    k: v for k, v in row.items() if k not in ["latitude", "longitude"]
                }
            }
            original_features.append(feature)
        except (ValueError, KeyError) as e:
            print("Skipping row:", row)
            continue

    print(f"Original features count: {len(original_features)}")
    
    # Create original GeoJSON
    original_geojson = {
        "type": "FeatureCollection",
        "features": original_features
    }
    
    # Apply clustering if enabled
    clustered_features = original_features.copy()
    if enable_clustering and len(original_features) > 1:
        clustered_features = cluster_geojson_points(original_features, cluster_distance_km)
        print(f"Clustered features count: {len(clustered_features)}")
        reduction_percent = ((len(original_features) - len(clustered_features)) / len(original_features) * 100) if len(original_features) > 0 else 0
        print(f"Data reduction: {reduction_percent:.1f}% fewer points")
    
    clustered_geojson = {
        "type": "FeatureCollection",
        "features": clustered_features
    }
    
    if return_both:
        return {
            "original": original_geojson,
            "clustered": clustered_geojson,
            "clustering_enabled": enable_clustering,
            "cluster_distance_km": cluster_distance_km,
            "original_count": len(original_features),
            "clustered_count": len(clustered_features)
        }
    else:
        # Return clustered version for backward compatibility
        return clustered_geojson

def _openaq_headers():
    print("=== OpenAQ Headers Debug ===")
    # print("OPENAQ_API_KEY:", OPENAQ_API_KEY)
    # print("OPENAQ_BASE:", OPENAQ_BASE)
    h = {"Accept": "application/json"}
    if OPENAQ_API_KEY:
        h["X-API-Key"] = OPENAQ_API_KEY
        print("Added API key to headers")
    else:
        print("WARNING: No API key found - requests may be rate limited")
    # print("Final headers:", h)
    # print("=== End Debug ===")
    return h


def pm25_to_aqi(value: float):
    """Convert PM2.5 concentration (µg/m³) to US EPA AQI (24h breakpoints)."""
    if value is None:
        return None
    try:
        c = float(value)
    except (TypeError, ValueError):
        return None
    # EPA PM2.5 AQI breakpoints
    bps = [
        (0.0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500),
    ]
    for Cl, Ch, Il, Ih in bps:
        if Cl <= c <= Ch:
            return int(round(((Ih - Il) / (Ch - Cl)) * (c - Cl) + Il))
    return None


def openaq_latest_pm25_bbox(minx, miny, maxx, maxy, limit=1000):

    print(f"Fetching OpenAQ PM2.5 data for bbox: {minx}, {miny}, {maxx}, {maxy} with limit {limit}")

    params = {
        "bbox": f"{minx},{miny},{maxx},{maxy}",
        "parameter": "pm25",
        "limit": int(limit),
        "key": OPENAQ_API_KEY
    }
    url = f"{OPENAQ_BASE}/latest"
    # print("Requesting OpenAQ URL:", url, "with params:", params)
    r = requests.get(url, params=params, headers=_openaq_headers(), timeout=20)
    r.raise_for_status()
    return r.json()


def open_aq_locations_pm25_bbox(minx, miny, maxx, maxy, limit=1000):
    url = f"{OPENAQ_BASE}/locations"
    params = {
        "bbox": f"{minx},{miny},{maxx},{maxy}",
        "parameter": "pm25",
        "limit": int(limit),
    }
    r = requests.get(url, params=params, headers=_openaq_headers(), timeout=20)
    r.raise_for_status()
    return r.json()


def open_aq_to_geojson_aqi(payload, min_aqi=0):
    """Convert OpenAQ /latest payload → GeoJSON FeatureCollection, filter by AQI."""
    features = []
    for item in payload:
        # print("Processing item:", item)
        coords = item.get("coordinates") or {}
        lon, lat = coords.get("longitude"), coords.get("latitude")
        if lon is None or lat is None:
            continue

        # PM2.5 value can appear under different keys depending on deployment.
        # Common patterns:
        pm = None
        for mkey in ("measurements", "parameters", "latestMeasurements", "latestValues"):
            arr = item.get(mkey)
            if isinstance(arr, list):
                pm = next((m for m in arr if (m.get("parameter") == "pm25" and m.get("value") is not None)), None)
                if pm: break

        if not pm: 
            continue

        aqi = pm25_to_aqi(pm.get("value"))
        if aqi is None or aqi < min_aqi:
            continue
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                "aqi": aqi,
                "value": pm.get("value"),
                "unit": pm.get("unit"),
                "location": item.get("location"),
                "city": item.get("city"),
                "country": item.get("country"),
                "datetime": pm.get("datetime") or pm.get("lastUpdated"),
                "sourceName": item.get("sourceName") or item.get("source_id"),
            }
        })
    return {"type": "FeatureCollection", "features": features}

def openaq_param_pm25_latest(limit=3000, page=3):
    """Fetch OpenAQ v3 latest measurements for parameter PM2.5 (id=2).
    This returns actual values with coordinates and datetime; bbox filtering is done client-side.
    """
    url = f"{OPENAQ_BASE}/parameters/2/latest"  # OPENAQ_BASE should be https://api.openaq.org/v3
    params = {"limit": int(limit), "page": int(page)}
    r = requests.get(url, params=params, headers=_openaq_headers(), timeout=20)
    r.raise_for_status()
    return r.json()


def openaq_param_latest_to_geojson_aqi(payload, min_aqi=0, bbox=None):
    """Convert `/parameters/2/latest` payload → GeoJSON FeatureCollection, with optional bbox filter.
    `bbox` is (minx, miny, maxx, maxy).
    """
    features = []
    debug_counts = {"total": 0, "missing_coords": 0, "missing_value": 0, "outside_bbox": 0, "below_min_aqi": 0}
    
    # Handle different payload formats
    results = []
    if isinstance(payload, dict):
        results = payload.get("results", [])
    elif isinstance(payload, list):
        results = payload
    else:
        print(f"Warning: Unexpected payload type: {type(payload)}")
        
    debug_counts["total"] = len(results)
    print(f"Processing {debug_counts['total']} results")
    
    for item in results:
        # Extract coordinates
        coords = item.get("coordinates") or {}
        lat = coords.get("latitude")
        lon = coords.get("longitude")
        value = item.get("value")
        
        # Debug missing data
        if lat is None or lon is None:
            debug_counts["missing_coords"] += 1
            continue
        if value is None:
            debug_counts["missing_value"] += 1
            continue

        # Optional bbox filter
        if bbox is not None:
            minx, miny, maxx, maxy = bbox
            if not (minx <= lon <= maxx and miny <= lat <= maxy):
                debug_counts["outside_bbox"] += 1
                continue

        # Calculate AQI and filter
        aqi = pm25_to_aqi(value)
        if aqi is None or aqi < min_aqi:
            debug_counts["below_min_aqi"] += 1
            continue

        # Extract datetime information
        dt = item.get("datetime") or {}
        unit = item.get("unit") or "µg/m³"
        
        # Create GeoJSON feature
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                "aqi": aqi,
                "value": value,
                "unit": unit,
                "datetime_utc": dt.get("utc"),
                "datetime_local": dt.get("local"),
                "sensorId": item.get("sensorsId") or item.get("sensorId"),
                "locationId": item.get("locationsId") or item.get("locationId")
            }
        })
    
    # Print debug information
    # print(f"Conversion results: {debug_counts}")
    print(f"Generated {len(features)} GeoJSON features")
    
    return {"type": "FeatureCollection", "features": features}
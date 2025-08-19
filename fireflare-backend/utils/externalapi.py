import requests
import csv
import os 
from io import StringIO



OPENAQ_BASE = os.getenv("OPENAQ_BASE")
OPENAQ_API_KEY = os.getenv("OPENAQ_API_KEY")



def fetch_nasa_geojson(map_key, source, bbox, days):
    base_url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
    coords = ",".join(map(str, bbox))  # [west, south, east, north]
    url = f"{base_url}/{map_key}/{source}/{coords}/{days}/"
    print(url)
    features = []
    response = requests.get(url, timeout=15)

    if not response.ok:
        raise RuntimeError(f"NASA API error: {response.status_code}")
    count = 0
    f = StringIO(response.text.lstrip("\ufeff"))  # strip BOM if present
    reader = csv.DictReader(f)

    for row in reader:
        # print(row)
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
            features.append(feature)
        except (ValueError, KeyError) as e:
            print("Skipping row:", row)
            continue

    return {
        "type": "FeatureCollection",
        "features": features
    }

def _openaq_headers():
    print("OPENAQ_API_KEY:", OPENAQ_API_KEY)
    h = {"Accept": "application/json"}
    if OPENAQ_API_KEY:
        h["X-API-Key"] = OPENAQ_API_KEY
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
    }
    url = f"{OPENAQ_BASE}/latest"
    r = requests.get(url, params=params, headers=_openaq_headers(), timeout=20)
    r.raise_for_status()
    return r.json()

def openaq_to_geojson_aqi(latest_json, min_aqi=0):
    """Convert OpenAQ /latest payload → GeoJSON FeatureCollection, filter by AQI."""
    features = []
    for item in latest_json.get("results", []):
        coords = item.get("coordinates") or {}
        lon, lat = coords.get("longitude"), coords.get("latitude")
        if lon is None or lat is None:
            continue

        # Find pm25 measurement
        pm = next((m for m in item.get("measurements", [])
                   if m.get("parameter") == "pm25" and m.get("value") is not None), None)
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
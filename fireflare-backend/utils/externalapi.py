import requests
import csv
from io import StringIO

def fetch_nasa_geojson(map_key, source, bbox, days):
    base_url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"
    coords = ",".join(map(str, bbox))  # [west, south, east, north]
    url = f"{base_url}/{map_key}/{source}/{coords}/{days}/"
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
# fireflare-backend/utils/csv_to_geojson.py

# import csv
# import json

import math
# def convert_csv_to_geojson(csv_path, geojson_path):

from dataclasses import dataclass
from utils.calculate import haversine_distance
from utils.boundaries import WILDFIRE_ZONES

@dataclass
class GridPoint:
    lat: float
    lon: float
    zone: str
    spacing_km: int
    priority: int

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



def get_wildfire_zone(lat: float, lon: float):
    """
    Determine which wildfire zone a point belongs to.
    Returns the zone name and WildfireZone object.
    Defaults to 'default_zone' if no specific zone matches.
    """

    for zone_name, zone in WILDFIRE_ZONES.items():
        bounds = zone.bounds
        if (bounds['lat_min'] <= lat <= bounds['lat_max'] and
            bounds['lon_min'] <= lon <= bounds['lon_max']):
            
            return zone_name, zone
    
    default_zone = WILDFIRE_ZONES['eastern_us_plains']

    return 'default_zone', default_zone
    


def generate_points_grid():

    """
    Generate grid with smooth transitions between zones.
    Uses zone-specific spacing for each point.
    """
    grid_points = []
    
    # Import North America bounds to include Canada and Alaska
    from .boundaries import NORTH_AMERICA_BOUNDS
    
    print("Generating wildfire grid...")
    print(f"Bounds: {NORTH_AMERICA_BOUNDS}")
    
    lat = NORTH_AMERICA_BOUNDS['lat_min']
    total_processed = 0
    
    while lat <= NORTH_AMERICA_BOUNDS['lat_max']:
        lon = NORTH_AMERICA_BOUNDS['lon_min']
        points_in_row = 0
        
        while lon <= NORTH_AMERICA_BOUNDS['lon_max']:
            # Get zone for this point
            zone_name, zone = get_wildfire_zone(lat, lon)
            
            # Add point
            if zone is None:
                print(f"⚠️  Warning: No zone found for point {lat}, {lon}")
            grid_points.append(GridPoint(
                lat=round(lat, 4),
                lon=round(lon, 4),
                zone=zone_name,
                spacing_km=zone.spacing_km,
                priority=zone.priority
            ))
            
            points_in_row += 1
            total_processed += 1
            
            # Use zone-specific spacing for next longitude step
            lon_spacing = zone.spacing_km / (111 * math.cos(math.radians(lat)))
            lon += lon_spacing
        
        # For latitude, sample at midpoint to get average spacing for this row
        mid_lon = (NORTH_AMERICA_BOUNDS['lon_min'] + NORTH_AMERICA_BOUNDS['lon_max']) / 2
        _, sample_zone = get_wildfire_zone(lat, mid_lon)
        lat_spacing = sample_zone.spacing_km / 111
        lat += lat_spacing
        
        if total_processed % 500 == 0:
            print(f"  Processed {total_processed} points...")
    
    print(f"Finished generating grid with {len(grid_points)} total points")
    return grid_points
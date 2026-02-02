from dataclasses import dataclass
import math
from typing import Dict, List, Optional


@dataclass
class CityExclusion:
    name: str
    lat: float
    lon: float
    radius_km: float

@dataclass
class WildfireZone:
    priority: int
    spacing_km: int
    bounds: Dict[str, float]
    exclude_cities: Optional[List[CityExclusion]] = None


# Boundaries for various geographical regions, zones, or other relevant areas.
NORTH_AMERICA_BOUNDS = {
    'lat_min': 25.0,   # Southern US
    'lat_max': 70.0,   # Northern Canada (excludes Arctic)
    'lon_min': -141.0, # Alaska/Yukon
    'lon_max': -52.0   # Newfoundland
}

WILDFIRE_ZONES = {
    # ... existing US zones ...
    'california_forests': WildfireZone(
        priority=1,
        spacing_km=25,
        bounds={
            'lat_min': 32.5,
            'lat_max': 42.0,
            'lon_min': -124.5,
            'lon_max': -114.0
        },
        exclude_cities=[
            CityExclusion('LA Basin', 34.05, -118.24, 40),
            CityExclusion('SF Bay', 37.77, -122.42, 35),
            CityExclusion('San Diego', 32.72, -117.16, 25)
        ]
    ),
    
    'pacific_northwest_forests': WildfireZone(
        priority=2,
        spacing_km=30,
        bounds={
            'lat_min': 42.0,
            'lat_max': 49.0,
            'lon_min': -124.5,
            'lon_max': -116.0
        },
        exclude_cities=[
            CityExclusion('Seattle', 47.61, -122.33, 30),
            CityExclusion('Portland', 45.52, -122.68, 25)
        ]
    ),
    
    'northern_rockies': WildfireZone(
        priority=3,
        spacing_km=35,
        bounds={
            'lat_min': 41.0,
            'lat_max': 49.0,
            'lon_min': -116.0,
            'lon_max': -104.0
        }
    ),
    
    'southwest_deserts': WildfireZone(
        priority=4,
        spacing_km=40,
        bounds={
            'lat_min': 31.0,
            'lat_max': 37.0,
            'lon_min': -115.0,
            'lon_max': -103.0
        },
        exclude_cities=[
            CityExclusion('Phoenix', 33.45, -112.07, 30),
            CityExclusion('Albuquerque', 35.08, -106.65, 20)
        ]
    ),
    
    'colorado_utah_forests': WildfireZone(
        priority=5,
        spacing_km=45,
        bounds={
            'lat_min': 37.0,
            'lat_max': 42.0,
            'lon_min': -114.0,
            'lon_max': -102.0
        },
        exclude_cities=[
            CityExclusion('Denver', 39.74, -104.99, 30)
        ]
    ),
    
    'texas_brushland': WildfireZone(
        priority=6,
        spacing_km=50,
        bounds={
            'lat_min': 26.0,
            'lat_max': 36.5,
            'lon_min': -106.5,
            'lon_max': -93.5
        },
        exclude_cities=[
            CityExclusion('Dallas', 32.78, -96.80, 35),
            CityExclusion('Houston', 29.76, -95.37, 35),
            CityExclusion('Austin', 30.27, -97.74, 25)
        ]
    ),
    
    'southern_forests': WildfireZone(
        priority=7,
        spacing_km=60,
        bounds={
            'lat_min': 25.0,
            'lat_max': 37.0,
            'lon_min': -93.5,
            'lon_max': -75.0
        }
    ),
    
    'eastern_us_plains': WildfireZone(
        priority=8,
        spacing_km=100,
        bounds={
            'lat_min': 25.0,
            'lat_max': 49.0,
            'lon_min': -104.0,
            'lon_max': -67.0
        }
    ),
    'british_columbia_forests': WildfireZone(
        priority=2,  # Very high risk!
        spacing_km=30,
        bounds={
            'lat_min': 48.3,
            'lat_max': 60.0,
            'lon_min': -139.0,
            'lon_max': -114.0
        },
        exclude_cities=[
            CityExclusion('Vancouver', 49.28, -123.12, 30),
            CityExclusion('Victoria', 48.43, -123.37, 20)
        ]
    ),
    
    'alberta_forests': WildfireZone(
        priority=3,
        spacing_km=35,
        bounds={
            'lat_min': 49.0,
            'lat_max': 60.0,
            'lon_min': -120.0,
            'lon_max': -110.0
        },
        exclude_cities=[
            CityExclusion('Calgary', 51.05, -114.07, 25),
            CityExclusion('Edmonton', 53.55, -113.47, 25)
        ]
    ),
    
    'ontario_quebec_forests': WildfireZone(
        priority=5,
        spacing_km=50,
        bounds={
            'lat_min': 45.0,
            'lat_max': 55.0,
            'lon_min': -95.0,
            'lon_max': -74.0
        },
        exclude_cities=[
            CityExclusion('Toronto', 43.65, -79.38, 35),
            CityExclusion('Montreal', 45.50, -73.57, 30),
            CityExclusion('Ottawa', 45.42, -75.70, 25)
        ]
    ),
    
    'northern_territories': WildfireZone(
        priority=6,
        spacing_km=60,
        bounds={
            'lat_min': 60.0,
            'lat_max': 70.0,
            'lon_min': -141.0,
            'lon_max': -60.0
        }
    ),
    
    'maritime_provinces': WildfireZone(
        priority=7,
        spacing_km=60,
        bounds={
            'lat_min': 43.0,
            'lat_max': 51.0,
            'lon_min': -67.0,
            'lon_max': -52.0
        }
    )
}
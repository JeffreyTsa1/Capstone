# GeoJSON Clustering Implementation with Dual Storage

## Overview

This implementation adds intelligent clustering to reduce the size of NASA wildfire data by grouping nearby geographic points together, while preserving the complete original dataset. This addresses the issue of large, repetitive GeoJSON datasets from the NASA FIRMS API without compromising data integrity.

## Dual Storage Architecture

### Database Schema
The system now stores both original and clustered versions:

```javascript
{
  "lastUpdated": "2025-01-08T10:00:00Z",
  "originalData": {           // Complete NASA FIRMS data
    "type": "FeatureCollection",
    "features": [/* all original points */]
  },
  "clusteredData": {          // Optimized for frontend
    "type": "FeatureCollection", 
    "features": [/* clustered points */]
  },
  "clusteringMetadata": {
    "enabled": true,
    "distance_km": 5.0,
    "original_count": 1247,
    "clustered_count": 523,
    "reduction_percent": 58.1
  },
  "source": "NASA_VIIRS_SNPP_NRT",
  "bbox": [-140, 24, -50, 72],
  "days": 2,
  "fetchedAt": "2025-01-08T10:00:00Z"
}
```

### Benefits of Dual Storage
- **Data Integrity**: Complete NASA dataset preserved for analysis
- **Performance**: Optimized clustered data for frontend rendering
- **Flexibility**: Access either version based on use case
- **Analytics**: Rich metadata for monitoring clustering effectiveness
- **Migration**: Backward compatibility with existing systems

## Features

### 1. Distance-Based Clustering
- Uses the Haversine formula for accurate geographic distance calculations
- Groups points within a configurable distance threshold (default: 5km)
- Preserves geographic accuracy while reducing data payload

### 2. Property Aggregation
For clustered points, the system aggregates properties:

**Numeric Properties** (brightness, confidence, frp, etc.):
- `avg_*`: Average value across all points in cluster
- `max_*`: Maximum value in cluster  
- `min_*`: Minimum value in cluster

**Categorical Properties** (satellite, instrument, etc.):
- Collects unique values from all points in cluster

**Temporal Properties**:
- `latest_acq_date`: Most recent acquisition date
- `earliest_acq_date`: Oldest acquisition date

### 3. Cluster Metadata
Each cluster includes:
- `cluster_size`: Number of original points grouped together
- `cluster_type`: Set to "wildfire_cluster"
- Centroid coordinates (geographic center of all points)

## API Endpoints

### Data Access Endpoints

```javascript
// Get clustered data (default - optimized for frontend)
GET /wildfires/nasa
// Returns: Clustered GeoJSON with reduced payload size

// Get original complete data (for analysis/backup)
GET /wildfires/nasa/original  
// Returns: Complete NASA FIRMS dataset with metadata

// Force refresh data from NASA API
POST /wildfires/nasa/refresh
// Returns: Updated clustering statistics
```

### Configuration Endpoints
```javascript
// Get current configuration
GET /wildfires/clustering/config
// Returns: { "enable_clustering": true, "cluster_distance_km": 5.0 }

// Update configuration  
POST /wildfires/clustering/config
{
  "enable_clustering": true,
  "cluster_distance_km": 5.0
}

// Get clustering statistics  
GET /wildfires/clustering/stats
// Returns: Detailed clustering performance metrics
```

### Function Parameters
```python
fetch_nasa_geojson(
    map_key, 
    source, 
    bbox, 
    days,
    enable_clustering=True,    # Enable/disable clustering
    cluster_distance_km=5.0,   # Distance threshold in kilometers
    return_both=False          # Return both original and clustered data
)
```

## Performance Benefits

### Before Clustering
- Individual point for every NASA detection
- Potential for thousands of overlapping points in active fire areas
- Large payload sizes affecting frontend performance

### After Clustering  
- Points within 5km grouped into single cluster
- Typical data reduction: 30-60% fewer points
- Maintained geographic accuracy and temporal information
- Faster map rendering and data transfer

## Example Results

```
Original features count: 1,247
Clustered features count: 523
Data reduction: 58.1% fewer points
```

## Implementation Details

### Distance Calculation
Uses the Haversine formula for great-circle distance:
```python
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth's radius in kilometers
    # Convert to radians and apply Haversine formula
    # Returns distance in kilometers
```

### Clustering Algorithm
1. Iterate through all points
2. For each unclustered point, find all nearby points within threshold
3. Create cluster with centroid coordinates and aggregated properties
4. Mark all clustered points as used
5. Continue until all points are processed

### Centroid Calculation
```python
centroid_lat = sum(all_latitudes) / count
centroid_lon = sum(all_longitudes) / count
```

## Testing

Run the test suite to verify clustering functionality:
```bash
python test_clustering.py
```

The test validates:
- Distance calculations
- Clustering algorithm accuracy
- Property aggregation
- Data reduction metrics

## Frontend Integration

The clustered data maintains GeoJSON compatibility. Frontend code can detect clusters by checking for the `cluster_size` property:

```javascript
if (feature.properties.cluster_size > 1) {
    // This is a cluster - show aggregated information
    const clusterSize = feature.properties.cluster_size;
    const avgBrightness = feature.properties.avg_brightness;
    const maxBrightness = feature.properties.max_brightness;
    
    // Show cluster info popup
    showClusterPopup(feature, {
        count: clusterSize,
        avgBrightness,
        maxBrightness
    });
} else {
    // Individual point - show normal information
    const brightness = feature.properties.brightness;
    const confidence = feature.properties.confidence;
    
    // Show individual fire info
    showFirePopup(feature, { brightness, confidence });
}
```

### Data Access Options

```javascript
// For normal map display (recommended)
const wildfireData = await fetch('/api/wildfires/nasa');

// For detailed analysis or data export
const originalData = await fetch('/api/wildfires/nasa/original');

// Check clustering performance
const stats = await fetch('/api/wildfires/clustering/stats');
console.log(`Data reduction: ${stats.reduction_percent}%`);
```

## Future Enhancements

1. **Adaptive Clustering**: Adjust cluster distance based on zoom level
2. **Temporal Clustering**: Group points by time as well as location
3. **Severity-Based Clustering**: Weight clustering by fire intensity
4. **Cache Clustered Results**: Store pre-clustered data for faster repeated access

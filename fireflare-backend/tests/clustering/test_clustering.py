#!/usr/bin/env python3
"""
Test script for GeoJSON clustering functionality.
"""

import sys
import os
import pytest

# Add parent directories to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from utils.geo import cluster_geojson_points, haversine_distance

class TestClustering:
    """Test cases for the GeoJSON clustering functionality."""
    
    @pytest.fixture
    def sample_features(self):
        """Sample GeoJSON features for testing."""
        return [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-118.2437, 34.0522]},  # LA
                "properties": {"brightness": 320.0, "confidence": 90, "satellite": "VIIRS"}
            },
            {
                "type": "Feature", 
                "geometry": {"type": "Point", "coordinates": [-118.2500, 34.0500]},  # Near LA
                "properties": {"brightness": 315.0, "confidence": 85, "satellite": "VIIRS"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-118.2600, 34.0600]},  # Near LA
                "properties": {"brightness": 330.0, "confidence": 95, "satellite": "VIIRS"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-122.4194, 37.7749]},  # SF (far)
                "properties": {"brightness": 310.0, "confidence": 80, "satellite": "VIIRS"}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-74.0060, 40.7128]},   # NYC (very far)
                "properties": {"brightness": 300.0, "confidence": 75, "satellite": "VIIRS"}
            }
        ]
    
    def test_haversine_distance_calculation(self):
        """Test the Haversine distance calculation."""
        # Test known distance: LA to SF (~559 km)
        la_lat, la_lon = 34.0522, -118.2437
        sf_lat, sf_lon = 37.7749, -122.4194
        
        distance = haversine_distance(la_lat, la_lon, sf_lat, sf_lon)
        
        # Should be approximately 559 km (allow ±10 km tolerance)
        assert 549 <= distance <= 569, f"Expected ~559 km, got {distance:.2f} km"
    
    def test_clustering_reduces_points(self, sample_features):
        """Test that clustering reduces the number of points."""
        original_count = len(sample_features)
        clustered_features = cluster_geojson_points(sample_features, cluster_distance_km=10.0)
        clustered_count = len(clustered_features)
        
        assert clustered_count < original_count, "Clustering should reduce the number of points"
        assert clustered_count > 0, "Should have at least one clustered result"
    
    def test_clustering_10km_threshold(self, sample_features):
        """Test clustering with 10km threshold."""
        clustered_features = cluster_geojson_points(sample_features, cluster_distance_km=10.0)
        
        # LA area points should be clustered together, SF and NYC separate
        assert len(clustered_features) == 3, "Should have 3 clusters: LA cluster, SF, NYC"
        
        # Check that we have one cluster and two individual points
        clusters = sum(1 for f in clustered_features if f["properties"].get("cluster_size", 1) > 1)
        individuals = sum(1 for f in clustered_features if f["properties"].get("cluster_size", 1) == 1)
        
        assert clusters == 1, "Should have exactly 1 cluster"
        assert individuals == 2, "Should have exactly 2 individual points"
    
    def test_clustering_5km_threshold(self, sample_features):
        """Test clustering with tighter 5km threshold."""
        clustered_features = cluster_geojson_points(sample_features, cluster_distance_km=5.0)
        
        # With tighter clustering, should still group LA area points
        assert len(clustered_features) <= len(sample_features), "Should not increase point count"
    
    def test_cluster_properties_aggregation(self, sample_features):
        """Test that cluster properties are properly aggregated."""
        clustered_features = cluster_geojson_points(sample_features, cluster_distance_km=10.0)
        
        # Find the cluster (should be the LA area cluster)
        cluster = next(f for f in clustered_features if f["properties"].get("cluster_size", 1) > 1)
        
        assert "avg_brightness" in cluster["properties"], "Should have average brightness"
        assert "max_brightness" in cluster["properties"], "Should have max brightness"
        assert "min_brightness" in cluster["properties"], "Should have min brightness"
        assert "cluster_size" in cluster["properties"], "Should have cluster size"
        assert cluster["properties"]["cluster_size"] == 3, "LA cluster should have 3 points"
    
    def test_empty_features_list(self):
        """Test clustering with empty features list."""
        result = cluster_geojson_points([], cluster_distance_km=5.0)
        assert result == [], "Empty list should return empty list"
    
    def test_single_feature(self):
        """Test clustering with single feature."""
        single_feature = [{
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [-118.2437, 34.0522]},
            "properties": {"brightness": 320.0}
        }]
        
        result = cluster_geojson_points(single_feature, cluster_distance_km=5.0)
        assert len(result) == 1, "Single feature should return single feature"
        assert result[0] == single_feature[0], "Single feature should be unchanged"
    
    def test_all_points_far_apart(self):
        """Test clustering when all points are far apart."""
        far_features = [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-118.2437, 34.0522]},  # LA
                "properties": {"brightness": 320.0}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-87.6298, 41.8781]},   # Chicago
                "properties": {"brightness": 315.0}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-74.0060, 40.7128]},   # NYC
                "properties": {"brightness": 310.0}
            }
        ]
        
        result = cluster_geojson_points(far_features, cluster_distance_km=5.0)
        assert len(result) == 3, "All far apart points should remain separate"
        
        # None should be clusters
        clusters = sum(1 for f in result if f["properties"].get("cluster_size", 1) > 1)
        assert clusters == 0, "No clusters should be formed"
    
    def test_cluster_centroid_calculation(self):
        """Test that cluster centroid is calculated correctly."""
        # Two points with known coordinates
        features = [
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-118.0, 34.0]},
                "properties": {"brightness": 300.0}
            },
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [-118.1, 34.1]},
                "properties": {"brightness": 320.0}
            }
        ]
        
        result = cluster_geojson_points(features, cluster_distance_km=20.0)
        assert len(result) == 1, "Should create one cluster"
        
        cluster = result[0]
        centroid = cluster["geometry"]["coordinates"]
        
        # Centroid should be the average: (-118.05, 34.05)
        expected_lon = (-118.0 + -118.1) / 2
        expected_lat = (34.0 + 34.1) / 2
        
        assert abs(centroid[0] - expected_lon) < 0.001, f"Longitude centroid incorrect: {centroid[0]} vs {expected_lon}"
        assert abs(centroid[1] - expected_lat) < 0.001, f"Latitude centroid incorrect: {centroid[1]} vs {expected_lat}"

def test_clustering_performance():
    """Test clustering performance with larger dataset."""
    # Create a larger dataset for performance testing
    import random
    
    large_features = []
    for i in range(1000):
        # Random points around California
        lon = -124 + random.random() * 10  # Longitude range
        lat = 32 + random.random() * 10    # Latitude range
        
        large_features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {"brightness": 300 + random.random() * 100}
        })
    
    import time
    start_time = time.time()
    
    result = cluster_geojson_points(large_features, cluster_distance_km=5.0)
    
    end_time = time.time()
    processing_time = end_time - start_time
    
    print(f"Processed {len(large_features)} features in {processing_time:.3f} seconds")
    print(f"Reduced to {len(result)} clustered features")
    
    # Should complete in reasonable time (under 10 seconds for 1000 points)
    assert processing_time < 10.0, f"Clustering took too long: {processing_time:.3f}s"
    assert len(result) < len(large_features), "Should reduce the number of features"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])

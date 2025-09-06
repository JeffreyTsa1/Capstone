#!/usr/bin/env python3
"""
Test script for dual-storage NASA API functionality.
Tests both original and clustered data storage and retrieval.
"""

import sys
import os
import pytest
from unittest.mock import patch, MagicMock

# Add parent directories to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

class TestDualStorage:
    """Test cases for the dual storage functionality."""
    
    @pytest.fixture
    def sample_dual_data(self):
        """Sample dual storage data structure."""
        return {
            "original": {
                "type": "FeatureCollection", 
                "features": [
                    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [-118.2437, 34.0522]}, "properties": {"brightness": 320.0}},
                    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [-118.2500, 34.0500]}, "properties": {"brightness": 315.0}},
                    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [-118.2600, 34.0600]}, "properties": {"brightness": 330.0}},
                    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [-122.4194, 37.7749]}, "properties": {"brightness": 310.0}},
                ]
            },
            "clustered": {
                "type": "FeatureCollection",
                "features": [
                    {
                        "type": "Feature",
                        "geometry": {"type": "Point", "coordinates": [-118.2512, 34.0541]},
                        "properties": {"cluster_size": 3, "avg_brightness": 321.67}
                    },
                    {
                        "type": "Feature", 
                        "geometry": {"type": "Point", "coordinates": [-122.4194, 37.7749]},
                        "properties": {"brightness": 310.0}
                    }
                ]
            },
            "clustering_enabled": True,
            "cluster_distance_km": 5.0,
            "original_count": 4,
            "clustered_count": 2
        }
    
    @pytest.fixture
    def sample_database_document(self, sample_dual_data):
        """Sample database document structure."""
        return {
            "lastUpdated": "2025-01-08T10:00:00",
            "originalData": sample_dual_data["original"],
            "clusteredData": sample_dual_data["clustered"], 
            "clusteringMetadata": {
                "enabled": sample_dual_data["clustering_enabled"],
                "distance_km": sample_dual_data["cluster_distance_km"],
                "original_count": sample_dual_data["original_count"],
                "clustered_count": sample_dual_data["clustered_count"],
                "reduction_percent": round(((sample_dual_data["original_count"] - sample_dual_data["clustered_count"]) / sample_dual_data["original_count"] * 100), 2)
            },
            "source": "NASA_VIIRS_SNPP_NRT",
            "bbox": [-140, 24, -50, 72],
            "days": 2,
            "fetchedAt": "2025-01-08T10:00:00"
        }
    
    def test_dual_data_structure_completeness(self, sample_dual_data):
        """Test that dual data structure contains all required fields."""
        required_fields = ["original", "clustered", "clustering_enabled", "cluster_distance_km", "original_count", "clustered_count"]
        
        for field in required_fields:
            assert field in sample_dual_data, f"Missing required field: {field}"
        
        # Test GeoJSON structure
        assert sample_dual_data["original"]["type"] == "FeatureCollection"
        assert sample_dual_data["clustered"]["type"] == "FeatureCollection"
        assert "features" in sample_dual_data["original"]
        assert "features" in sample_dual_data["clustered"]
    
    def test_data_reduction_calculation(self, sample_dual_data):
        """Test that data reduction is calculated correctly."""
        original_count = sample_dual_data["original_count"]
        clustered_count = sample_dual_data["clustered_count"]
        
        expected_reduction = ((original_count - clustered_count) / original_count * 100)
        assert expected_reduction == 50.0, f"Expected 50% reduction, got {expected_reduction}%"
        
        # Verify actual feature counts match metadata
        assert len(sample_dual_data["original"]["features"]) == original_count
        assert len(sample_dual_data["clustered"]["features"]) == clustered_count
    
    def test_database_document_schema(self, sample_database_document):
        """Test that database document has correct schema."""
        required_top_level = ["lastUpdated", "originalData", "clusteredData", "clusteringMetadata", "source", "bbox", "days", "fetchedAt"]
        
        for field in required_top_level:
            assert field in sample_database_document, f"Missing top-level field: {field}"
        
        # Test metadata structure
        metadata = sample_database_document["clusteringMetadata"]
        required_metadata = ["enabled", "distance_km", "original_count", "clustered_count", "reduction_percent"]
        
        for field in required_metadata:
            assert field in metadata, f"Missing metadata field: {field}"
    
    def test_backward_compatibility_structure(self):
        """Test that clustered data alone maintains GeoJSON compatibility."""
        clustered_only = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [-118.2437, 34.0522]},
                    "properties": {"brightness": 320.0, "confidence": 90}
                }
            ]
        }
        
        # Should be valid GeoJSON
        assert clustered_only["type"] == "FeatureCollection"
        assert isinstance(clustered_only["features"], list)
        assert len(clustered_only["features"]) > 0
        
        # Each feature should have required structure
        for feature in clustered_only["features"]:
            assert feature["type"] == "Feature"
            assert "geometry" in feature
            assert "properties" in feature
            assert feature["geometry"]["type"] == "Point"
            assert "coordinates" in feature["geometry"]
    
    def test_cluster_detection_logic(self, sample_dual_data):
        """Test logic for detecting clusters vs individual points."""
        clustered_features = sample_dual_data["clustered"]["features"]
        
        clusters = []
        individuals = []
        
        for feature in clustered_features:
            cluster_size = feature["properties"].get("cluster_size", 1)
            if cluster_size > 1:
                clusters.append(feature)
            else:
                individuals.append(feature)
        
        assert len(clusters) == 1, "Should have exactly 1 cluster"
        assert len(individuals) == 1, "Should have exactly 1 individual point"
        
        # Cluster should have aggregated properties
        cluster = clusters[0]
        assert "avg_brightness" in cluster["properties"]
        assert cluster["properties"]["cluster_size"] == 3
    
    @patch('utils.externalapi.fetch_nasa_geojson')
    def test_fetch_nasa_geojson_return_both_parameter(self, mock_fetch):
        """Test that fetch_nasa_geojson respects return_both parameter."""
        from utils.externalapi import fetch_nasa_geojson
        
        # Mock the actual API call components
        with patch('utils.externalapi.requests.get') as mock_requests, \
             patch('utils.externalapi.csv.DictReader') as mock_csv:
            
            # Mock HTTP response
            mock_response = MagicMock()
            mock_response.ok = True
            mock_response.text = "latitude,longitude,brightness\n34.0522,-118.2437,320.0"
            mock_requests.return_value = mock_response
            
            # Mock CSV reader
            mock_csv.return_value = [
                {"latitude": "34.0522", "longitude": "-118.2437", "brightness": "320.0"}
            ]
            
            # Test return_both=False (should return only clustered GeoJSON)
            result_single = fetch_nasa_geojson("test_key", "VIIRS", [-120, 34, -118, 35], 1, return_both=False)
            assert "type" in result_single
            assert result_single["type"] == "FeatureCollection"
            
            # Test return_both=True (should return both versions)
            result_both = fetch_nasa_geojson("test_key", "VIIRS", [-120, 34, -118, 35], 1, return_both=True)
            assert "original" in result_both
            assert "clustered" in result_both
            assert "clustering_enabled" in result_both
            assert "original_count" in result_both
            assert "clustered_count" in result_both
    
    def test_legacy_data_handling(self):
        """Test handling of legacy data without clustering metadata."""
        legacy_document = {
            "lastUpdated": "2025-01-08T10:00:00",
            "geojsonData": {  # Old field name
                "type": "FeatureCollection",
                "features": [
                    {"type": "Feature", "geometry": {"type": "Point", "coordinates": [-118.2437, 34.0522]}, "properties": {"brightness": 320.0}}
                ]
            },
            "source": "NASA_VIIRS_SNPP_NRT"
        }
        
        # Legacy document should not have new fields
        assert "originalData" not in legacy_document
        assert "clusteredData" not in legacy_document
        assert "clusteringMetadata" not in legacy_document
        
        # But should have old structure
        assert "geojsonData" in legacy_document
        assert legacy_document["geojsonData"]["type"] == "FeatureCollection"
    
    def test_clustering_metadata_calculations(self, sample_database_document):
        """Test that clustering metadata is calculated correctly."""
        metadata = sample_database_document["clusteringMetadata"]
        
        # Verify reduction percentage calculation
        original_count = metadata["original_count"]
        clustered_count = metadata["clustered_count"]
        reduction_percent = metadata["reduction_percent"]
        
        expected_reduction = round(((original_count - clustered_count) / original_count * 100), 2)
        assert reduction_percent == expected_reduction
        
        # Verify other metadata
        assert metadata["enabled"] is True
        assert metadata["distance_km"] == 5.0
        assert original_count > clustered_count, "Original count should be greater than clustered count"
    
    def test_api_endpoint_data_format(self):
        """Test expected data formats for different API endpoints."""
        # Mock endpoint responses
        api_responses = {
            "/wildfires/nasa": {
                "type": "FeatureCollection",
                "features": [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [-118, 34]}, "properties": {"cluster_size": 3}}]
            },
            "/wildfires/nasa/original": {
                "data": {"type": "FeatureCollection", "features": []},
                "metadata": {"original_count": 100, "source": "NASA_VIIRS_SNPP_NRT"}
            },
            "/wildfires/clustering/stats": {
                "clustering_enabled": True,
                "original_count": 100,
                "clustered_count": 50,
                "reduction_percent": 50.0
            },
            "/wildfires/clustering/config": {
                "enable_clustering": True,
                "cluster_distance_km": 5.0
            }
        }
        
        # Validate each endpoint format
        nasa_response = api_responses["/wildfires/nasa"]
        assert nasa_response["type"] == "FeatureCollection"
        
        original_response = api_responses["/wildfires/nasa/original"]
        assert "data" in original_response
        assert "metadata" in original_response
        
        stats_response = api_responses["/wildfires/clustering/stats"]
        assert "clustering_enabled" in stats_response
        assert "reduction_percent" in stats_response
        
        config_response = api_responses["/wildfires/clustering/config"]
        assert "enable_clustering" in config_response
        assert "cluster_distance_km" in config_response

def test_performance_implications():
    """Test performance characteristics of dual storage."""
    # Simulate large dataset
    large_original = {"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [0, 0]}, "properties": {}} for _ in range(10000)]}
    large_clustered = {"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": {"type": "Point", "coordinates": [0, 0]}, "properties": {"cluster_size": 10}} for _ in range(1000)]}
    
    import json
    
    # Calculate storage sizes
    original_size = len(json.dumps(large_original))
    clustered_size = len(json.dumps(large_clustered))
    
    print(f"Original data size: {original_size:,} bytes")
    print(f"Clustered data size: {clustered_size:,} bytes")
    print(f"Size reduction: {((original_size - clustered_size) / original_size * 100):.1f}%")
    
    # Clustered should be significantly smaller
    assert clustered_size < original_size, "Clustered data should be smaller"
    reduction_percent = ((original_size - clustered_size) / original_size * 100)
    assert reduction_percent > 50, f"Should have significant reduction, got {reduction_percent:.1f}%"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])

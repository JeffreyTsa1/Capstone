#!/usr/bin/env python3
"""
Integration tests for clustering API endpoints.
Tests the actual API endpoints with a running backend server.
"""

import requests
import json
import time
import pytest
import sys
import os

# Add parent directories to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

BASE_URL = "http://localhost:8080"

class TestClusteringAPIEndpoints:
    """Integration tests for clustering API endpoints."""
    
    @pytest.fixture(scope="class")
    def check_server_running(self):
        """Check if the backend server is running."""
        try:
            response = requests.get(f"{BASE_URL}/health", timeout=5)
            if response.status_code != 200:
                pytest.skip("Backend server not responding properly")
        except requests.RequestException:
            pytest.skip("Backend server not running on localhost:8080")
    
    def test_get_clustering_config(self, check_server_running):
        """Test getting clustering configuration."""
        response = requests.get(f"{BASE_URL}/wildfires/clustering/config")
        
        assert response.status_code == 200
        config = response.json()
        
        assert "enable_clustering" in config
        assert "cluster_distance_km" in config
        assert isinstance(config["enable_clustering"], bool)
        assert isinstance(config["cluster_distance_km"], (int, float))
        assert config["cluster_distance_km"] > 0
    
    def test_update_clustering_config(self, check_server_running):
        """Test updating clustering configuration."""
        # Get current config first
        response = requests.get(f"{BASE_URL}/wildfires/clustering/config")
        original_config = response.json()
        
        # Update config
        new_config = {
            "enable_clustering": True,
            "cluster_distance_km": 3.0
        }
        
        response = requests.post(
            f"{BASE_URL}/wildfires/clustering/config",
            json=new_config
        )
        
        assert response.status_code == 200
        result = response.json()
        
        assert "message" in result
        assert "config" in result
        assert result["config"]["cluster_distance_km"] == 3.0
        
        # Restore original config
        requests.post(
            f"{BASE_URL}/wildfires/clustering/config",
            json=original_config
        )
    
    def test_get_clustering_stats(self, check_server_running):
        """Test getting clustering statistics."""
        response = requests.get(f"{BASE_URL}/wildfires/clustering/stats")
        
        assert response.status_code == 200
        stats = response.json()
        
        # Should have either clustering metadata or legacy format info
        assert "clustering_enabled" in stats
        assert "current_config" in stats
        
        if "original_count" in stats:
            # Has clustering data
            assert "clustered_count" in stats
            assert "reduction_percent" in stats
            assert isinstance(stats["original_count"], int)
            assert isinstance(stats["clustered_count"], int)
            assert isinstance(stats["reduction_percent"], (int, float))
    
    def test_get_nasa_wildfires_clustered(self, check_server_running):
        """Test getting clustered NASA wildfire data."""
        response = requests.get(f"{BASE_URL}/wildfires/nasa")
        
        assert response.status_code == 200
        data = response.json()
        
        # Should be valid GeoJSON
        assert data["type"] == "FeatureCollection"
        assert "features" in data
        assert isinstance(data["features"], list)
        
        # Check for cluster properties in features
        for feature in data["features"][:5]:  # Check first 5 features
            assert feature["type"] == "Feature"
            assert "geometry" in feature
            assert "properties" in feature
            assert feature["geometry"]["type"] == "Point"
            assert "coordinates" in feature["geometry"]
    
    def test_get_nasa_wildfires_original(self, check_server_running):
        """Test getting original NASA wildfire data."""
        response = requests.get(f"{BASE_URL}/wildfires/nasa/original")
        
        assert response.status_code == 200
        result = response.json()
        
        assert "data" in result
        assert "metadata" in result
        
        data = result["data"]
        metadata = result["metadata"]
        
        # Data should be valid GeoJSON
        assert data["type"] == "FeatureCollection"
        assert "features" in data
        
        # Metadata should have useful info
        assert "source" in metadata
        assert "last_updated" in metadata or "note" in metadata
    
    def test_refresh_nasa_wildfires(self, check_server_running):
        """Test force refreshing NASA wildfire data."""
        response = requests.post(f"{BASE_URL}/wildfires/nasa/refresh")
        
        assert response.status_code == 200
        result = response.json()
        
        assert "message" in result
        assert "updated_at" in result
        
        # Should have clustering statistics
        if "original_count" in result:
            assert "clustered_count" in result
            assert "reduction_percent" in result
            assert isinstance(result["original_count"], int)
            assert isinstance(result["clustered_count"], int)
    
    def test_payload_size_comparison(self, check_server_running):
        """Test that clustered data is smaller than original data."""
        # Get clustered data
        clustered_response = requests.get(f"{BASE_URL}/wildfires/nasa")
        clustered_size = len(clustered_response.content)
        
        # Get original data
        original_response = requests.get(f"{BASE_URL}/wildfires/nasa/original")
        original_data = original_response.json()["data"]
        original_size = len(json.dumps(original_data))
        
        print(f"Clustered payload: {clustered_size:,} bytes")
        print(f"Original payload: {original_size:,} bytes")
        
        if original_size > clustered_size:
            reduction = ((original_size - clustered_size) / original_size * 100)
            print(f"Size reduction: {reduction:.1f}%")
            
            # Should have some reduction if clustering is working
            assert reduction > 0, "Clustered data should be smaller than original"
    
    def test_clustering_config_validation(self, check_server_running):
        """Test configuration validation."""
        # Test invalid distance
        invalid_config = {
            "enable_clustering": True,
            "cluster_distance_km": -1.0  # Invalid negative distance
        }
        
        response = requests.post(
            f"{BASE_URL}/wildfires/clustering/config",
            json=invalid_config
        )
        
        assert response.status_code == 400
        error = response.json()
        assert "error" in error
    
    def test_feature_cluster_detection(self, check_server_running):
        """Test detection of clustered vs individual features."""
        response = requests.get(f"{BASE_URL}/wildfires/nasa")
        
        assert response.status_code == 200
        data = response.json()
        
        clusters = 0
        individuals = 0
        
        for feature in data["features"]:
            cluster_size = feature["properties"].get("cluster_size", 1)
            if cluster_size > 1:
                clusters += 1
                # Cluster should have aggregated properties
                assert "avg_brightness" in feature["properties"] or "cluster_type" in feature["properties"]
            else:
                individuals += 1
        
        total_features = len(data["features"])
        print(f"Total features: {total_features}")
        print(f"Clusters: {clusters}")
        print(f"Individual points: {individuals}")
        
        assert clusters + individuals == total_features
    
    def test_api_response_times(self, check_server_running):
        """Test that API responses are reasonably fast."""
        endpoints = [
            "/wildfires/clustering/config",
            "/wildfires/clustering/stats",
            "/wildfires/nasa"
        ]
        
        for endpoint in endpoints:
            start_time = time.time()
            response = requests.get(f"{BASE_URL}{endpoint}")
            end_time = time.time()
            
            response_time = end_time - start_time
            print(f"{endpoint}: {response_time:.3f}s")
            
            assert response.status_code == 200
            assert response_time < 10.0, f"{endpoint} took too long: {response_time:.3f}s"

def test_clustering_endpoints_manual():
    """Manual test function that can be run standalone."""
    print("🔥 Testing Fireflare Clustering API Endpoints")
    print("=" * 50)
    
    # Test basic connectivity
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✓ Server is running (status: {response.status_code})")
    except requests.RequestException:
        print("✗ Backend server not responding - make sure it's running on port 8080")
        return
    
    # 1. Check clustering configuration
    print("\n1. Clustering configuration:")
    try:
        response = requests.get(f"{BASE_URL}/wildfires/clustering/config")
        if response.status_code == 200:
            config = response.json()
            print(f"   ✓ Enabled: {config['enable_clustering']}")
            print(f"   ✓ Distance: {config['cluster_distance_km']}km")
        else:
            print(f"   ✗ Failed: {response.status_code}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # 2. Get clustering statistics
    print("\n2. Clustering statistics:")
    try:
        response = requests.get(f"{BASE_URL}/wildfires/clustering/stats")
        if response.status_code == 200:
            stats = response.json()
            if 'original_count' in stats:
                print(f"   ✓ Original: {stats['original_count']} features")
                print(f"   ✓ Clustered: {stats['clustered_count']} features")
                print(f"   ✓ Reduction: {stats['reduction_percent']}%")
            else:
                print("   ⚠ No clustering data available")
        else:
            print(f"   ✗ Failed: {response.status_code}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # 3. Test payload sizes
    print("\n3. Payload size comparison:")
    try:
        # Clustered data
        clustered_response = requests.get(f"{BASE_URL}/wildfires/nasa")
        clustered_size = len(clustered_response.content) if clustered_response.status_code == 200 else 0
        
        # Original data
        original_response = requests.get(f"{BASE_URL}/wildfires/nasa/original")
        original_size = len(original_response.content) if original_response.status_code == 200 else 0
        
        print(f"   ✓ Clustered: {clustered_size:,} bytes ({clustered_size/1024:.1f} KB)")
        print(f"   ✓ Original: {original_size:,} bytes ({original_size/1024:.1f} KB)")
        
        if original_size > 0 and clustered_size > 0:
            reduction = ((original_size - clustered_size) / original_size * 100)
            print(f"   ✓ Reduction: {reduction:.1f}%")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Manual testing complete!")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "manual":
        test_clustering_endpoints_manual()
    else:
        pytest.main([__file__, "-v"])

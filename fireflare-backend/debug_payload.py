#!/usr/bin/env python3
"""
Debug script to check payload sizes and clustering status.
"""

import requests
import json
import sys

def debug_payload_size():
    """Check the current payload size and clustering status"""
    
    base_url = "http://localhost:8080"
    
    print("🔍 Debugging Fireflare NASA API Payload Size")
    print("=" * 60)
    
    try:
        # 1. Check clustering configuration
        print("\n1. Current Clustering Configuration:")
        config_response = requests.get(f"{base_url}/wildfires/clustering/config")
        if config_response.status_code == 200:
            config = config_response.json()
            print(f"   ✓ Clustering enabled: {config['enable_clustering']}")
            print(f"   ✓ Distance threshold: {config['cluster_distance_km']}km")
        else:
            print(f"   ✗ Could not get config: {config_response.status_code}")
        
        # 2. Check clustering statistics
        print("\n2. Current Data Statistics:")
        stats_response = requests.get(f"{base_url}/wildfires/clustering/stats")
        if stats_response.status_code == 200:
            stats = stats_response.json()
            if 'original_count' in stats:
                print(f"   ✓ Original features: {stats['original_count']}")
                print(f"   ✓ Clustered features: {stats['clustered_count']}")
                print(f"   ✓ Reduction: {stats['reduction_percent']}%")
                print(f"   ✓ Last updated: {stats.get('last_updated', 'Unknown')}")
            else:
                print(f"   ⚠️ No clustering metadata found - using legacy data")
        else:
            print(f"   ✗ Could not get stats: {stats_response.status_code}")
        
        # 3. Check current API payload
        print("\n3. Current API Payload Analysis:")
        nasa_response = requests.get(f"{base_url}/wildfires/nasa")
        if nasa_response.status_code == 200:
            data = nasa_response.json()
            features = data.get('features', [])
            
            # Calculate payload size
            payload_size = len(nasa_response.content)
            payload_size_kb = payload_size / 1024
            
            print(f"   ✓ Response status: {nasa_response.status_code}")
            print(f"   ✓ Feature count: {len(features)}")
            print(f"   ✓ Payload size: {payload_size:,} bytes ({payload_size_kb:.1f} KB)")
            
            # Analyze features for clustering
            clusters = 0
            individuals = 0
            total_cluster_size = 0
            
            for feature in features:
                props = feature.get('properties', {})
                cluster_size = props.get('cluster_size', 1)
                
                if cluster_size > 1:
                    clusters += 1
                    total_cluster_size += cluster_size
                else:
                    individuals += 1
            
            print(f"   ✓ Clusters found: {clusters}")
            print(f"   ✓ Individual points: {individuals}")
            
            if clusters > 0:
                print(f"   ✓ Total points represented by clusters: {total_cluster_size}")
                estimated_original = total_cluster_size + individuals
                print(f"   ✓ Estimated original point count: {estimated_original}")
                reduction = ((estimated_original - len(features)) / estimated_original * 100) if estimated_original > 0 else 0
                print(f"   ✓ Effective reduction: {reduction:.1f}%")
            else:
                print(f"   ⚠️ No clusters detected - clustering may not be applied")
            
        else:
            print(f"   ✗ Could not get NASA data: {nasa_response.status_code}")
            
        # 4. Force refresh and compare
        print("\n4. Force Refresh Test:")
        refresh_response = requests.post(f"{base_url}/wildfires/nasa/refresh")
        if refresh_response.status_code == 200:
            refresh_data = refresh_response.json()
            print(f"   ✓ Refresh successful")
            print(f"   ✓ Original count: {refresh_data.get('original_count', 'Unknown')}")
            print(f"   ✓ Clustered count: {refresh_data.get('clustered_count', 'Unknown')}")
            print(f"   ✓ Reduction: {refresh_data.get('reduction_percent', 'Unknown')}%")
            
            # Check new payload size
            new_response = requests.get(f"{base_url}/wildfires/nasa")
            if new_response.status_code == 200:
                new_size = len(new_response.content)
                new_size_kb = new_size / 1024
                print(f"   ✓ New payload size: {new_size:,} bytes ({new_size_kb:.1f} KB)")
                
                if nasa_response.status_code == 200:
                    size_change = new_size - payload_size
                    print(f"   ✓ Size change: {size_change:+,} bytes")
        else:
            print(f"   ✗ Could not refresh data: {refresh_response.status_code}")
            
        print(f"\n{'='*60}")
        print("🎯 Diagnosis Summary:")
        
        if nasa_response.status_code == 200:
            features = nasa_response.json().get('features', [])
            has_clusters = any(f.get('properties', {}).get('cluster_size', 1) > 1 for f in features)
            
            if has_clusters:
                print("✅ Clustering appears to be working correctly")
                print("📊 If payload seems large, consider:")
                print("   • Reducing cluster_distance_km for tighter clustering")
                print("   • Checking if there are many isolated fire points")
                print("   • Comparing with older API without clustering")
            else:
                print("⚠️  Clustering may not be applied to current data")
                print("🔧 Troubleshooting steps:")
                print("   • Force refresh data with POST /wildfires/nasa/refresh")
                print("   • Check if clustering is enabled in config")
                print("   • Verify clustering distance threshold")
        
    except requests.ConnectionError:
        print("❌ Could not connect to backend server")
        print("   Make sure your backend is running on localhost:8080")
    except Exception as e:
        print(f"❌ Error during analysis: {e}")

if __name__ == "__main__":
    debug_payload_size()

#!/usr/bin/env python3
"""
Migration script to apply clustering to existing database records.
Run this once to cluster any legacy data in your database.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from backend import db, nasaWildfiresCollection
from utils.externalapi import cluster_geojson_points
import datetime

def migrate_legacy_data():
    """Apply clustering to existing database records that don't have it"""
    
    print("🔄 Migrating legacy NASA wildfire data to use clustering...")
    print("=" * 60)
    
    # Find all records that don't have clustered data
    legacy_records = list(nasaWildfiresCollection.find({
        "clusteredData": {"$exists": False}
    }))
    
    print(f"Found {len(legacy_records)} legacy records to migrate")
    
    if len(legacy_records) == 0:
        print("✅ No legacy data found - all records already use clustering!")
        return
    
    migrated_count = 0
    
    for record in legacy_records:
        try:
            # Get the original GeoJSON data
            geojson_data = record.get("geojsonData")
            if not geojson_data or not geojson_data.get("features"):
                print(f"⚠️  Skipping record {record.get('_id')} - no features found")
                continue
            
            original_features = geojson_data["features"]
            original_count = len(original_features)
            
            # Apply clustering with default settings
            clustered_features = cluster_geojson_points(original_features, 5.0)
            clustered_count = len(clustered_features)
            
            # Calculate reduction
            reduction_percent = ((original_count - clustered_count) / original_count * 100) if original_count > 0 else 0
            
            # Create the new document structure
            updated_doc = {
                "$set": {
                    "originalData": {
                        "type": "FeatureCollection",
                        "features": original_features
                    },
                    "clusteredData": {
                        "type": "FeatureCollection", 
                        "features": clustered_features
                    },
                    "clusteringMetadata": {
                        "enabled": True,
                        "distance_km": 5.0,
                        "original_count": original_count,
                        "clustered_count": clustered_count,
                        "reduction_percent": round(reduction_percent, 2),
                        "migrated_at": datetime.datetime.now().isoformat()
                    }
                },
                "$unset": {
                    "geojsonData": ""  # Remove the old field
                }
            }
            
            # Update the record
            result = nasaWildfiresCollection.update_one(
                {"_id": record["_id"]},
                updated_doc
            )
            
            if result.modified_count > 0:
                print(f"✅ Migrated record {record.get('_id')}")
                print(f"   Original: {original_count} → Clustered: {clustered_count} ({reduction_percent:.1f}% reduction)")
                migrated_count += 1
            else:
                print(f"⚠️  Failed to update record {record.get('_id')}")
                
        except Exception as e:
            print(f"❌ Error migrating record {record.get('_id')}: {e}")
            continue
    
    print("\n" + "=" * 60)
    print(f"🎉 Migration complete!")
    print(f"📊 Successfully migrated {migrated_count} out of {len(legacy_records)} records")
    
    if migrated_count > 0:
        print("\n🔍 Verifying migration...")
        
        # Check that we now have clustered data
        updated_records = list(nasaWildfiresCollection.find({
            "clusteredData": {"$exists": True}
        }))
        
        remaining_legacy = list(nasaWildfiresCollection.find({
            "geojsonData": {"$exists": True},
            "clusteredData": {"$exists": False}
        }))
        
        print(f"✅ Records with clustering: {len(updated_records)}")
        print(f"⚠️  Legacy records remaining: {len(remaining_legacy)}")
        
        if len(remaining_legacy) == 0:
            print("🎊 All data successfully migrated to clustering format!")

if __name__ == "__main__":
    migrate_legacy_data()

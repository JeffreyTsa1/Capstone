from flask import Flask, request, jsonify, Response
from flask_restful import Resource, Api, reqparse
from utils.externalapi import fetch_nasa_geojson
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from bson import json_util, ObjectId
import os
import datetime

import json
import pandas as pd
import numpy as np
import random
import re
import smtplib
import ssl
import requests




sampleUserSchema = {
    "userID": "user_9f8d7e6a5b4c3d2e1f0a",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "location": {
      "type": "Point",
      "coordinates": [-123.1207, 49.2827]
    },
    "verified": True,
    "address": "123 Main St, Vancouver, BC, Canada",
    "trustScore": 75,
    "createdAt": "2025-07-17T20:35:00Z",
    "updatedAt": "2025-07-17T21:00:00Z"
}


sampleModeratorSchema = {  
        "userID": "user_9f8d7e6a5b4c3d2e1f0a",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "location": {
      "type": "Point",
      "coordinates": [-123.1207, 49.2827]
    },
    "verified": True,
    "address": "123 Main St, Vancouver, BC, Canada",
    "trustScore": 75,
    "createdAt": "2025-07-17T20:35:00Z",
    "updatedAt": "2025-07-17T21:00:00Z",
    "lastModeratedAt": "2025-07-17T20:35:00Z",
    "status": "active",  # or "inactive", "suspended"
    "approvedReports": ["report_01H6XZ1234567890ABCDEF", "report_01H6XZ1234567890ABCDEF"],  # List of report IDs
    "moderatorName": "Jane Smith",
    "moderatorBackground": "Experienced in wildfire management and environmental science.",
    "moderatorContact": {
        "email": "jane.smith@example.com",
        "phone": "+1-234-567-8901"
    }
}

sampleReportSchema = {
  "id": "report_01H6XZ1234567890ABCDEF",  
  "author": "user_9f8d7e6a5b4c3d2e1f0a",  
  "location": {
    "latitude": 49.2827,
    "longitude": -123.1207,
    "accuracy": 10
  },
  "radiusMeters": 250,
  "type": "smoke",
  "severity": "moderate",
  "description": "Dense smoke visible from Stanley Park.",
  "metadata": {
    "schemaVersion": "1.0",
    "source": "web-app",
    "deviceInfo": {
      "deviceType": "iPhone 15",
      "osVersion": "iOS 18.0.2"
    }
  },
  "reportedAt": "2025-07-17T20:35:00Z",
  "syncedAt": "2025-07-17T21:00:00Z",
  "editedAt": "2025-07-17T21:00:00Z",
  "isDeleted": False
}


from pprint import PrettyPrinter

app = Flask(__name__)
load_dotenv(dotenv_path='.env.local') # Explicitly load .env.local
CORS(app)
mapbox_api = os.getenv("MAP_KEY")
cluster = os.getenv("MONGO_CLUSTER_URL")
client = MongoClient(cluster)

db = client.Fireflare

reportCollection = db.Reports
userCollection = db.Users
moderatorCollection = db.Moderators

# cachedWildfireData = db.wildfireCache

# requestCollection = db.PayoutRequests
# userCollection.create_index([("email")])

# @app.route("/")
# def hello_world():
#     # print(companyCollection.find())
#     return "<p>Hello, World!</p>"


#    const userResponse = await fetch(`http://127.0.0.1:8080/users/check/${user.sub}`, {
      
@app.route('/users/check/<user_id>', methods=['GET'])
def checkUser(user_id):
    print("Checking User")
    if not user_id:
        return jsonify({"error": "No user ID provided"}), 400
    
    # First check Users collection
    userObject = userCollection.find_one({"userID": user_id})
    print("User Object:", userObject)
    if userObject:
        # Convert ObjectId to string for JSON serialization
        userObject['_id'] = str(userObject['_id'])
        
        # Convert datetime fields to string for JSON serialization
        if 'createdAt' in userObject and isinstance(userObject['createdAt'], datetime.datetime):
            userObject['createdAt'] = userObject['createdAt'].isoformat()
        if 'updatedAt' in userObject and isinstance(userObject['updatedAt'], datetime.datetime):
            userObject['updatedAt'] = userObject['updatedAt'].isoformat()
            
        return jsonify({"exists": True, "type": "user", "user": userObject}), 200
    
    # If not found in Users, check Moderators collection
    moderatorObject = moderatorCollection.find_one({"userID": user_id})
    if moderatorObject:
        # Convert ObjectId to string for JSON serialization
        moderatorObject['_id'] = str(moderatorObject['_id'])
        
        # Convert datetime fields to string for JSON serialization
        if 'createdAt' in moderatorObject and isinstance(moderatorObject['createdAt'], datetime.datetime):
            moderatorObject['createdAt'] = moderatorObject['createdAt'].isoformat()
        if 'updatedAt' in moderatorObject and isinstance(moderatorObject['updatedAt'], datetime.datetime):
            moderatorObject['updatedAt'] = moderatorObject['updatedAt'].isoformat()
            
        return jsonify({"exists": True, "type": "moderator", "user": moderatorObject}), 200
    
    # User not found in either collection
    return jsonify({"exists": False}), 200







@app.route('/users/create', methods=['POST'])
def createUser():
    print("Creating User")
    try:
        data = request.get_json()
        print("Received data:", data)
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        userId = data.get("auth0Id")  # Changed from userID to auth0Id to match frontend
        email = data.get("email")
        firstName = data.get("firstName")
        lastName = data.get("lastName")
        phone = data.get("phone")  # Added phone field
        location_coords = data.get("location", [0, 0])
        
        # Convert location to GeoJSON format
        location = {
            "type": "Point", 
            "coordinates": location_coords
        }
        
        verified = data.get("verified", False)
        address = data.get("address", "")
        trustScore = data.get("trustScore", 0)
        createdAt = datetime.datetime.now().isoformat()
        updatedAt = createdAt

        newUser = {
            "userID": userId,  # Store as userID in database
            "email": email,
            "firstName": firstName,
            "lastName": lastName,
            "phone": phone,
            "location": location,
            "verified": verified,
            "address": address,
            "trustScore": trustScore,
            "createdAt": createdAt,
            "updatedAt": updatedAt
        }
        
        print("Creating user with data:", newUser)
        
        # Insert the new user into the database
        result = userCollection.insert_one(newUser)
        if result.acknowledged:
            return jsonify({"message": "User created successfully", "userID": str(result.inserted_id)}), 201
        else:
            return jsonify({"error": "Failed to create user"}), 500
            
    except Exception as e:
        print(f"Error creating user: {str(e)}")
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route('/users/update', methods=['PATCH'])
def updateUser():
    
    print("Updating User")
    data = request.get_json()

    if not data or 'userID' not in data:
        return jsonify({"error": "No user ID provided"}), 400
    
    userId = data['userID']
    print("finished printing userObject")
    userObject = userCollection.find_one({"userID": userId})
    print(userObject)
    if not userObject:
        return jsonify({"error": "Invalid user ID"}), 400

    update_fields = {}
    for key in data:
        if key not in ['userID', 'email', 'firstName', 'lastName', 'location', 'verified', 'address', 'trustScore']:
            return jsonify({"error": f"Invalid field: {key}"}), 400
        update_fields[key] = data[key]
    update_fields['updatedAt'] = datetime.datetime.now().isoformat()
    # Update the user in the database
    result = userCollection.update_one({"userID": userId}, {"$set": update_fields})
    
    if result.modified_count > 0:
        return jsonify({"message": "User updated successfully"}), 200
    elif result.matched_count == 0:
        return jsonify({"error": "no results updated, userId does exist, but no changes made"}), 200
    else:
        return jsonify({"error": "Failed to update user"}), 500


@app.route('/moderators/create', methods=['POST'])
def createModerator():
    print("Creating Moderator")
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    else:
        newModerator = {
        "userID": data.get("userID", f"user_{str(ObjectId())[:16]}"),
        "email": data.get("email"),
        "firstName": data.get("firstName"),
        "lastName": data.get("lastName"),
        "location": data.get("location", {"type": "Point", "coordinates": [0, 0]}),
        "verified": data.get("verified", False),
        "address": data.get("address", ""),
        "createdAt": datetime.datetime.now().isoformat(),
        "updatedAt": datetime.datetime.now().isoformat(),
        "lastModeratedAt": datetime.datetime.now().isoformat(),
        "status": data.get("status", "active"),
        "approvedReports": data.get("approvedReports", []),
        "moderatorName": "Jane Smith",
        "moderatorBackground": "Experienced in wildfire management and environmental science.",
        "moderatorContact": {
            "email": "jane.smith@example.com",
            "phone": "+1-234-567-8901"
        }
    }
    moderatorCollection.insert_one(newModerator)
    return jsonify({"message": "Moderator created successfully", "userID": newModerator["userID"]}), 201

@app.route('/moderators/disable', methods=['PATCH'])
def disableModerator():
    print("Disabling Moderator")
    data = request.get_json()
    if not data or 'userID' not in data:
        return jsonify({"error": "No user ID provided"}), 400
    
    userId = data['userID']
    moderatorObject = moderatorCollection.find_one({"userID": userId})

    if not moderatorObject:
        return jsonify({"error": "Invalid user ID"}), 400

    update_fields = {
        "status": "inactive",
        "lastModeratedAt": datetime.datetime.now().isoformat()
    }
    
    result = moderatorCollection.update_one({"userID": userId}, {"$set": update_fields})
    
    if result.modified_count > 0:
        return jsonify({"message": "Moderator disabled successfully"}), 200
    elif result.matched_count == 0:
        return jsonify({"error": "no results updated, userId does exist, but no changes made"}), 200
    else:
        return jsonify({"error": "Failed to disable moderator"}), 500



@app.route('/report/all', methods=['GET'])
def getAllReports():
    print("Test")
    reports = reportCollection.find({})
    return json_util.dumps({"reports": reports}), 200, {'Content-Type': 'application/json'} 

@app.route('/report/<report_id>', methods=['GET'])
def getReportById(report_id):
    print("Test")
    if not ObjectId.is_valid(report_id):
        return jsonify({"error": "Invalid report ID"}), 400
    report = reportCollection.find_one({"_id": ObjectId(report_id)})
    if not report:
        return jsonify({"error": "Report not found"}), 404
    # Convert ObjectId to string for JSON serialization
    report['_id'] = str(report['_id'])
    # Convert datetime fields to string for JSON serialization
    if 'created_at' in report and isinstance(report['created_at'], datetime.datetime):
        report['created_at'] = report['created_at'].isoformat()
    return json_util.dumps({"report": report}), 200, {'Content-Type': 'application/json'}


@app.route('/report/create', methods=['POST'])
def createReport(userId=None, location=None, radiusMeters=250, type="smoke", severity="moderate", description=None, photos=None, reportedAt=None, metadata=None):

    data = request.get_json()
    if not data or 'userId' not in data:
        return jsonify({"error": "No data provided"}), 400
    else:
        userId = data.get("userId")
        location = data.get("location")
        radiusMeters = data.get("radiusMeters", 250)
        type = data.get("type", "smoke")
        severity = data.get("severity", "moderate")
        description = data.get("description")
        reportedAt = data.get("reportedAt", datetime.datetime.now().isoformat())
        metadata = data.get("metadata", {})
        
        newReport = {
        "id": f"report_{str(ObjectId())[:16]}",  # Generate a unique report ID
        "author": userId,
        "location": {
            "latitude": location.get("latitude", 0),
            "longitude": location.get("longitude", 0),
            "accuracy": location.get("accuracy", 0)
        },
        "radiusMeters": radiusMeters,
        "type": type,
        "severity": severity,
        "description": description,
        "metadata": {
            "schemaVersion": "1.0",
            "source": "web-app",
            "deviceInfo": {
            "deviceType": "iPhone 15",
            "osVersion": "iOS 18.0.2"
            }
        },
        "moderatorDescription":{},
        "reportedAt": "2025-07-17T20:35:00Z",
        "syncedAt": "2025-07-17T21:00:00Z",
        "editedAt": "2025-07-17T21:00:00Z",
        "isDeleted": False
        }
        reportCollection.insert_one(newReport)
        return jsonify({"message": "Report created successfully", "reportId": newReport["id"]}), 201
    

@app.route('/report/approve', methods=['POST'])
def approveReport():
    data = request.get_json()
    if not data or "userId" not in data:
        return jsonify({"error": "Invalid request"}), 400
    
    userId = data["userId"]
    moderatorObject = moderatorCollection.find_one({"userID": userId})
    if not moderatorObject:
        return jsonify({"error": "Invalid user ID"}), 400
    # Update the report's status to approved

    update_fields = {
        "status": "approved",
        "moderatorName": moderatorObject.get("moderatorName", "Unknown"),
        "moderatorBackground": moderatorObject.get("moderatorBackground", ""),
        "moderatorContact": moderatorObject.get("moderatorContact", {}),
        "lastModeratedAt": datetime.datetime.now().isoformat()
    }

    result = moderatorCollection.update_one({"userID": userId}, {"$set": update_fields})
    if result.modified_count > 0:
        return jsonify({"message": "Moderator approved successfully"}), 200
    elif result.matched_count == 0:
        return jsonify({"error": "No results updated, userId does exist, but no changes made"}), 200
    else:
        return jsonify({"error": "Failed to approve moderator"}), 500

@app.route('/wildfires/get', methods=['GET'])
def getWildfires():
    # Fetch wildfires data from the database
    wildfires = []  # Replace with actual database query
    # For now, we'll use a placeholder list of wildfires
    # return geojson
    if not wildfires:
        return jsonify({"wildfires": []}), 200
    else:
        # Convert wildfires data to GeoJSON format
        geojson = {
            "type": "FeatureCollection",
            "features": []
        }
        for wildfire in wildfires:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [wildfire['location']['longitude'], wildfire['location']['latitude']]
                },
                "properties": {
                    "id": wildfire['id'],
                    "severity": wildfire['severity'],
                    "description": wildfire.get('description', ''),
                    "timestamp": wildfire.get('timestamp', '')
                }
            }
            geojson['features'].append(feature)
        return jsonify(geojson), 200
    # return json_util.dumps({"wildfires": wildfires}), 200, {'Content-Type': 'application/json'}

@app.route('/wildfires/nasa', methods=['GET'])
def getNasaWildfires():
    # url = "https://firms.modaps.eosdis.nasa.gov/api/area/csv/1027666d5687783ceeb6f012af7044ce/VIIRS_SNPP_NRT/-140,24,-50,72/5/"
    # test_url = "https://jsonplaceholder.typicode.com/todos"
    # response = requests.get(test_url)
#   database_url = os.getenv("DATABASE_URL")
#   debug_mode = os.getenv("DEBUG_MODE")
    
    # print(response.status_code)
    geojson_data = fetch_nasa_geojson (
            map_key= mapbox_api,
            source="VIIRS_SNPP_NRT",
            bbox=[-140, 24, -50, 72],
            days=2
        )
    # print(geojson_data[0:3])
    # if response.status_code == 200:
        # geojson_data = response.json()
        # print(geojson_data)
        # print(geojson_data["features"][:3])  # preview 3 hotspots
    # else:
        # print("Error:", response.status_code)
    
    return jsonify(geojson_data), 200, {'Content-Type': 'application/json'}



if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
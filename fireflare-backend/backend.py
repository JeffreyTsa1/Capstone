from flask import Flask, request, jsonify, Response
from flask_restful import Resource, Api, reqparse

from utils.externalapi import (
    fetch_nasa_geojson,
    pm25_to_aqi,
    openaq_param_pm25_latest,
    openaq_param_latest_to_geojson_aqi
)
from utils.geo import cluster_geojson_points
from flask_cors import CORS
from pymongo import MongoClient
from bson import json_util, ObjectId
from collections import deque
import os
import datetime
import time
import json
import pandas as pd
import numpy as np
import random
import re
import smtplib
import ssl
import requests


from pprint import PrettyPrinter

app = Flask(__name__)
CORS(app)
mapbox_api = os.getenv("MAP_KEY")
cluster = os.getenv("MONGO_CLUSTER_URL")
client = MongoClient(cluster)

db = client.Fireflare

reportCollection = db.Reports
userCollection = db.Users
moderatorCollection = db.Moderators
nasaWildfiresCollection = db.NasaWildfires
notificationsCollection = db.Notifications
addressesCollection = db.Addresses
crisisCollection = db.Crises
aqiCollection = db.openWeatherAQIData

# Create indexes for better performance
try:
    # Index for lastUpdated field to avoid memory limit issues with sorting
    nasaWildfiresCollection.create_index([("lastUpdated", -1)])
    print("✅ Created index on nasaWildfiresCollection.lastUpdated")
except Exception as e:
    print(f"⚠️ Index creation info: {e}")

# Global list of connected SSE clients
notification_clients = []


def broadcast_notification_to_clients(user_ids: list, message: dict):
    formatted = f"data: {json.dumps(message)}\n\n"
    for client in notification_clients:
        if client.get("userID") in user_ids:
            client["queue"].append(formatted)
    print("📣 Broadcasting to:", user_ids)
    print("📡 Connected clients:", [c.get("userID") for c in notification_clients])


@app.route('/notifications/stream', methods=['GET'])
def notification_stream():
    
    user_id = request.args.get('userID')
    if not user_id:
        return jsonify({"error": "Missing userID in query params"}), 400
    q = deque()
    client = {"queue": q, "userID": user_id}
    notification_clients.append(client)

    print("✅ Client connected:", user_id)
    print("🔁 Current clients:", [c['userID'] for c in notification_clients])
    
    def event_stream():
        try:
            while True:
                while q:
                    yield q.popleft()
                time.sleep(1)
                yield ": keep-alive\n\n"
        finally:
            notification_clients.remove(client)

    return Response(event_stream(), mimetype='text/event-stream')



@app.route('/notifications/unseen/<user_id>', methods=['GET'])
def get_unseen_notifications(user_id):
    unseen = list(db.Notifications.find({"userID": user_id, "seen": False}))
    for n in unseen:
        n["_id"] = str(n["_id"])
    return jsonify({"notifications": unseen}), 200

@app.route('/notifications/mark-seen', methods=['PATCH'])
def mark_notifications_seen():
    data = request.get_json()
    user_id = data.get("userID")
    if not user_id:
        return jsonify({"error": "Missing userID"}), 400
    db.Notifications.update_many({"userID": user_id, "seen": False}, {"$set": {"seen": True}})
    return jsonify({"message": "Marked as seen"}), 200

# cachedWildfireData = db.wildfireCache

# requestCollection = db.PayoutRequests
# userCollection.create_index([("email")])

# @app.route("/")
# def hello_world():
#     # print(companyCollection.find())
#     return "<p>Hello, World!</p>"


#    const userResponse = await fetch(`http://127.0.0.1:8080/users/check/${user.sub}`, {
      

@app.route('/notifications/test', methods=['GET'])
def test_notification_all_users():
    print("Testing Notification Broadcast")
    allUsers = userCollection.find({}, {"userID": 1, "_id": 0})
    user_ids = [user["userID"] for user in allUsers if "userID" in user]
    user_ids = user_ids + [c.get("userID") for c in notification_clients]
    timestamp = datetime.datetime.utcnow().isoformat()
    message = {
        "title": "Test Notification",
        "body": "This is a test notification from Fireflare.",
        "timestamp": timestamp
    }

    # Save unseen notification for each user
    for uid in user_ids:
        db.Notifications.insert_one({
            "userID": uid,
            "message": message["body"],
            "title": message["title"],
            "timestamp": timestamp,
            "seen": False,
            "type": "test"
        })
    print("📣 Broadcasting to:", user_ids)
    print("📡 Connected clients:", [c.get("userID") for c in notification_clients])
    # Send to connected clients in real-time
    broadcast_notification_to_clients(user_ids, message)
    return jsonify({"message": "Notification sent to clients"}), 200


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


@app.route('/update/address/to/addresses', methods=['GET'])
def updateUserAddresses():
    allUsers = userCollection.find({})
    if not allUsers:
        return jsonify({"error": "No users found"}), 400
    else:
        for user in allUsers:
            if "addresses" not in user:
                if "address" in user and user["address"]:
                    newObj = [
                        {
                            "address": user["address"],
                            "label": "Home",
                            "coordinates": user.get("location", {}).get("coordinates", [0, 0]),
                            "addedAt": datetime.datetime.now().isoformat()
                        }
                    ]
                    userCollection.update_one({"_id": user["_id"]}, {"$set": {"addresses": newObj}})
                else:
                    return jsonify({"error": f"User {user['userID']} missing address field"}), 400

    return jsonify({"message": "User addresses updated successfully"}), 200


@app.route('/addresses/migrate/all', methods=['GET'])
def migrateAllAddresses():
    allUsers = userCollection.find({})
    if not allUsers:
        return jsonify({"error": "No users found"}), 400
    else:
        for user in allUsers:


            print("uupdating user:", user.get("addresses"))
            print("uupdating user:", user.get("address"))
            # print("Migrating addresses for user:", user)
            userAddresses = user.get("addresses", [])
            print("User Addresses:", userAddresses)
            for address in userAddresses:
                address["coordinates"] = user.get("location", {}).get("coordinates", [0, 0])
                newAddressObj = {
                    "userID": user.get("userID", ""),
                    "address": address.get("address", ""),
                    "label": address.get("label", "Home"),
                    "coordinates": address.get("coordinates", [0, 0]),
                    "addedAt": address.get("addedAt", datetime.datetime.now().isoformat())
                }
                print("New Address Object:", newAddressObj)
                result = addressesCollection.insert_one(newAddressObj)

                if not result.acknowledged:
                    return jsonify({"error": f"Failed to insert address for user {user['userID']}"}), 500
    return jsonify({"message": "All addresses migrated successfully"}), 200



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
        newAddresses = [{
            "address": address,
            "label": "Home",  # Optional label for the address,
            "coordinates": location_coords,
            "addedAt": createdAt
        }]
        newUser = {
            "userID": userId,  # Store as userID in database
            "email": email,
            "firstName": firstName,
            "lastName": lastName,
            "phone": phone,
            "location": location,
            "verified": verified,
            "addresses": newAddresses,
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
    userType = "user"
    if not userObject:
        userObject = moderatorCollection.find_one({"userID": userId})
        if not userObject:
            return jsonify({"error": "Invalid user ID"}), 400
        userType = "moderator"

    update_fields = {}
    data_minus_userID = {k: v for k, v in data.items() if k != 'userID'}
    for key in data_minus_userID:
        if key not in ['email', 'firstName', 'lastName', 'location','addresses', 'address']:
            return jsonify({"error": f"Invalid field: {key}"}), 400
        update_fields[key] = data_minus_userID[key]
    update_fields['updatedAt'] = datetime.datetime.now().isoformat()
    result = None
    # Update the user in the database
    if userType == "moderator":
        result = moderatorCollection.update_one({"userID": userId}, {"$set": update_fields})
    else:
        result = userCollection.update_one({"userID": userId}, {"$set": update_fields})

    if result.modified_count > 0:
        return jsonify({"message": "User updated successfully"}), 200
    elif result.matched_count == 0:
        return jsonify({"error": "no results updated, userId does exist, but no changes made"}), 200
    else:
        return jsonify({"error": "Failed to update user"}), 500



@app.route('/users/migrate', methods=['POST'])
def migrateUser():
    print("Migrating User")
    data = request.get_json()
    if not data or 'userID' not in data:
        return jsonify({"error": "No user ID provided"}), 400
    
    userId = data['userID']
    userObject = userCollection.find_one({"userID": userId})

    if not userObject:
        return jsonify({"error": "Invalid user ID"}), 400

    # Check if the user already exists in Moderators collection
    existingModerator = moderatorCollection.find_one({"userID": userId})
    if existingModerator:
        return jsonify({"error": "User already exists as a moderator"}), 400

    # Create a new moderator object based on the user object
    newModerator = {
        "userID": userObject["userID"],
        "email": userObject["email"],
        "firstName": userObject["firstName"],
        "lastName": userObject["lastName"],
        "location": userObject["location"],
        "verified": userObject.get("verified", False),
        "address": userObject.get("address", ""),
        "createdAt": datetime.datetime.now().isoformat(),
        "updatedAt": datetime.datetime.now().isoformat(),
        "lastModeratedAt": datetime.datetime.now().isoformat(),
        "status": "active",
        "approvedReports": [],
        "moderatorName": "",
        "moderatorBackground": "",
        "moderatorContact": {}
    }

    # Insert the new moderator into the Moderators collection
    result = moderatorCollection.insert_one(newModerator)
    if result.acknowledged:
        # Optionally, you can remove the user from the Users collection if needed
        userCollection.delete_one({"userID": userId})
        # Return the new moderator object
        return jsonify({"message": "User migrated to moderator successfully", "userID": newModerator["userID"]}), 201
    else:
        return jsonify({"error": "Failed to insert user"}), 500


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



@app.route('/reports/all', methods=['GET'])
def getAllReports():
    print("Test")
    reports = reportCollection.find({})
    return json_util.dumps({"reports": reports}), 200, {'Content-Type': 'application/json'} 

@app.route('/reports/<user_id>', methods=['GET'])
def getReportsByUserId(user_id):
    print("Fetching Reports by User ID")
    if not user_id:
        return jsonify({"error": "No user ID provided"}), 400
    
    

    # Fetch reports by user ID
    reports = reportCollection.find({"author": user_id})
    
    if not reports:
        return jsonify({"error": "No reports found for this user"}), 404
    
    # Convert ObjectId to string for JSON serialization
    reports_list = []
    for report in reports:
        report['_id'] = str(report['_id'])
        # Convert datetime fields to string for JSON serialization
        if 'created_at' in report and isinstance(report['created_at'], datetime.datetime):
            report['created_at'] = report['created_at'].isoformat()
        reports_list.append(report)
    
    return json_util.dumps({"reports": reports_list}), 200, {'Content-Type': 'application/json'}



@app.route('/reports/<report_id>', methods=['GET'])
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


@app.route('/reports/create', methods=['POST'])
def createReport(userId=None, location=None, radiusMeters=250, type="smoke", severity="moderate", description=None, photos=None, reportedAt=None, metadata=None):
    print("################################ Creating Report ################################")

    current_time = datetime.datetime.now()
    data = request.get_json()
    if not data or 'userId' not in data:
        return jsonify({"error": "No data provided"}), 400
    else:
        userId = data.get("userId")
        location = data.get("location")
        radiusMeters = data.get("radiusMeters")
        type = data.get("type", "smoke")
        severity = data.get("severity", "moderate")
        description = data.get("description")
        reportedAt = data.get("reportedAt", datetime.datetime.now().isoformat())
        metadata = data.get("metadata", {})
        
        userInfo = None
        userInfo = userCollection.find_one({"userID": userId})
        if userInfo is None:
            userInfo = moderatorCollection.find_one({"userID": userId})
        print("User Info:", userInfo)
        newReport = {
        "author": userInfo.get("firstName") + " " + userInfo.get("lastName"),
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
        "moderatorDescription":[],
        "metadata": metadata,
        "reportedAt": reportedAt,
        "syncedAt": current_time.isoformat(),
        "editedAt": current_time.isoformat(),
        "approvedAt": None,
        "isDeleted": False,
        "isVerified": False  # Assuming a field to indicate if the report is valid
        }

        result = reportCollection.insert_one(newReport)
        

        return jsonify({"message": "Report created successfully", "reportId": str(result.inserted_id)}), 201



@app.route('/reports/approve', methods=['POST'])
def approveReport():
    data = request.get_json()
    # if not data or "userID" not in data or "reportID" not in data:
    #     print("Invalid request data:", data)
    #     return jsonify({"error": "Invalid request"}), 402

    userId = data["userID"]
    reportID = data.get("reportID")
    print("reportID:", reportID)
    moderatorObject = moderatorCollection.find_one({"userID": userId})
    if not moderatorObject:
        return jsonify({"error": "Couldn't find userID in the moderator table"}), 400
    # Update the report's status to approved
    report_object_id = ObjectId(reportID)
    currentReport = reportCollection.find_one({"_id": report_object_id})
    if not currentReport:
        print("Current Report:", currentReport)
        return jsonify({"error": "Report not found"}), 404
    
    currModeratorDescription = currentReport.get("moderatorDescription")
    approvedAt = None
    if currentReport["approvedAt"] != None:
        approvedAt = currentReport["approvedAt"]


    moderatorDescriptionObj = {
        "approvedAt": approvedAt if approvedAt else datetime.datetime.now().isoformat(),
        "moderatorDescription": data.get("moderatorDescription", ""),
        "moderatorName": moderatorObject.get("moderatorName", "Unknown"),
        "moderatorBackground": moderatorObject.get("moderatorBackground", ""),
        "moderatorContact": moderatorObject.get("moderatorContact", {}),
        "lastModeratedAt": datetime.datetime.now().isoformat(),
        "fireContained": False   
    }

    result = reportCollection.update_one({"_id": report_object_id}, {"$set": { "isVerified": True, "lastModeratedAt": datetime.datetime.now().isoformat(), "moderatorDescription": currModeratorDescription + [moderatorDescriptionObj]}})
    if result.modified_count > 0:
        
        nearby_users = userCollection.find({
            "location": {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [
                            currentReport["location"]["longitude"],
                            currentReport["location"]["latitude"]
                        ]
                    },
                    "$maxDistance": 10000
                }
            }
        })

        user_ids = []
        for u in nearby_users:
            user_ids.append(u["userID"])
            db.Notifications.insert_one({
                "userID": u["userID"],
                "message": "🔥 A new report was approved near your area.",
                "reportID": str(report_object_id),
                "seen": False,
                "createdAt": datetime.datetime.utcnow().isoformat()
            })

        broadcast_notification_to_clients(user_ids, {
            "title": "New Approved Report Nearby",
            "body": "A new report was approved near your area. Check it out!",
            "reportID": str(report_object_id),
            "timestamp": datetime.datetime.now().isoformat()
        })
        return jsonify({"message": "Moderator approved report "+ str(report_object_id) +" successfully"}), 200
    elif result.matched_count == 0:
        return jsonify({"error": "No results updated, userId does exist, but no changes made"}), 200
    else:
        return jsonify({"error": "Failed to approve moderator"}), 500


@app.route('/reports/reject', methods=['POST'])
def rejectReport():
    data = request.get_json()
    if not data or "userId" not in data:
        return jsonify({"error": "Invalid request"}), 400
    
    userId = data["userId"]
    reportID = data.get("reportID")
    moderatorObject = moderatorCollection.find_one({"userID": userId})
    if not moderatorObject:
        return jsonify({"error": "Invalid user ID"}), 400
    
    reportObject = reportCollection.find_one({"userID": userId, "reportID": reportID})
    if not reportObject:
        return jsonify({"error": "Report not found"}), 404
    
    # Update the report's status to rejected

    
    moderatorDescriptionObj = {
        "approvedAt": None,
        "moderatorDescription": data.get("moderatorDescription", ""),
        "moderatorName": moderatorObject.get("moderatorName", "Unknown"),
        "moderatorBackground": moderatorObject.get("moderatorBackground", ""),
        "moderatorContact": moderatorObject.get("moderatorContact", {}),
        "lastModeratedAt": datetime.datetime.now().isoformat(),
        "fireContained": False   
    }
    
    result = reportCollection.update_one({"userID": userId, "reportID": reportID}, {"$set": { "isVerified": False, "lastModeratedAt": datetime.datetime.now().isoformat(), "moderatorDescription": reportObject.get("moderatorDescription", []) + [moderatorDescriptionObj]}})
    
    if result.modified_count > 0:
        return jsonify({"message": "Moderator rejected report "+ reportID +" successfully"}), 200
    elif result.matched_count == 0:
        return jsonify({"error": "No results updated, userId does exist, but no changes made"}), 200
    else:
        return jsonify({"error": "Failed to reject moderator"}), 500

@app.route('/reports/update', methods=['PATCH'])
def updateReport():
    print("Updating Report")
    data = request.get_json()
    if not data or 'reportID' not in data:
        return jsonify({"error": "No report ID provided"}), 400
    if 'userID' not in data:
        return jsonify({"error": "No user ID provided"}), 400
    userId = data['userID']
    moderatorObject = moderatorCollection.find_one({"userID": userId})
    if not moderatorObject:
        return jsonify({"error": "You are not a moderator"}), 400

    reportObject = reportCollection.find_one({"userID": userId, "reportID": data.get('reportID')})
    if not reportObject:
        return jsonify({"error": "Report not found"}), 404

    reportID = data['reportID']
    update_fields = {}
    
    # Check if the report exists
    reportObject = reportCollection.find_one({"reportID": reportID})
    if not reportObject:
        return jsonify({"error": "Report not found"}), 404
    
    # Update fields based on provided data
    for key in data:
        if key in ['location', 'radiusMeters', 'type', 'severity', 'description', 'metadata']:
            update_fields[key] = data[key]
        else:
            return jsonify({"error": f"Invalid field: {key}"}), 400
    
    update_fields['editedAt'] = datetime.datetime.now().isoformat()
    
    # Update the report in the database
    result = reportCollection.update_one({"reportID": reportID}, {"$set": update_fields})
    
    if result.modified_count > 0:
        return jsonify({"message": "Report updated successfully"}), 200
    elif result.matched_count == 0:
        return jsonify({"error": "No results updated, reportId does exist, but no changes made"}), 200
    else:
        return jsonify({"error": "Failed to update report"}), 500



@app.route('/reports/escalate', methods=['POST'])
def escalateReport():
    data = request.get_json()
    if not data or "userId" not in data:
        return jsonify({"error": "Invalid request"}), 400
    
    userId = data["userId"]
    reportID = data.get("reportID")
    moderatorObject = moderatorCollection.find_one({"userID": userId})
    if not moderatorObject:
        return jsonify({"error": "Invalid user ID"}), 400
    
    # Update the report's status to escalated
    update_fields = {
        "status": "escalated",
        "lastModeratedAt": datetime.datetime.now().isoformat()
    }
    
    result = reportCollection.update_one({"userID": userId, "reportID": reportID}, {"$set": update_fields})
    
    if result.modified_count > 0:
        return jsonify({"message": "Moderator escalated report "+ reportID +" successfully"}), 200
    elif result.matched_count == 0:
        return jsonify({"error": "No results updated, userId does exist, but no changes made"}), 200
    else:
        return jsonify({"error": "Failed to escalate moderator"}), 500



##################### NASA Firms API #####################

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
    try:
        # Check if we have recent data in the database
        # Use limit(1) to avoid memory issues with large collections
        latest_data_cursor = nasaWildfiresCollection.find({}).sort([("lastUpdated", -1)]).limit(1)
        latest_data = None
        for doc in latest_data_cursor:
            latest_data = doc
            break
        
        current_time = datetime.datetime.now()
        should_fetch_new = True
        
        if latest_data:
            last_updated = latest_data.get("lastUpdated")
            if isinstance(last_updated, str):
                last_updated = datetime.datetime.fromisoformat(last_updated)
            elif isinstance(last_updated, datetime.datetime):
                pass  # Already a datetime object
            else:
                last_updated = datetime.datetime.min  # Force update if invalid format
            print(f"Last updated: {last_updated}, Current time: {current_time}")
            
            # Check if data is less than 4 hours old (adjust as needed)
            time_diff = current_time - last_updated
            if time_diff.total_seconds() < 14400:  # 4 hours in seconds
                should_fetch_new = False
                print("Using cached wildfire data from database")
                
                # Return cached clustered data (for performance) 
                # Check for new data structure first, fallback to old structure
                if "clusteredData" in latest_data:
                    geojson_data = latest_data["clusteredData"]
                    print(f"Returning cached clustered data with {len(geojson_data.get('features', []))} features")
                elif "geojsonData" in latest_data:
                    # Legacy data - apply clustering on-the-fly
                    print("Legacy data detected - applying clustering on-the-fly...")
                    legacy_geojson = latest_data["geojsonData"]
                    legacy_features = legacy_geojson.get("features", [])
                    
                    if len(legacy_features) > 1 and clustering_config['enable_clustering']:
                        clustered_features = cluster_geojson_points(
                            legacy_features, 
                            clustering_config['cluster_distance_km']
                        )
                        print(f"Applied clustering: {len(legacy_features)} → {len(clustered_features)} features")
                        geojson_data = {
                            "type": "FeatureCollection",
                            "features": clustered_features
                        }
                    else:
                        geojson_data = legacy_geojson
                        print("Using legacy data without clustering")
                else:
                    # No data found
                    geojson_data = {
                        "type": "FeatureCollection", 
                        "features": []
                    }
                    print("No data found - returning empty collection")
                
                return jsonify(geojson_data), 200, {'Content-Type': 'application/json'}
        
        if should_fetch_new:
            print("Fetching fresh wildfire data from NASA API")
            # Fetch both original and clustered data from NASA API
            nasa_data = fetch_nasa_geojson(
                map_key=mapbox_api,
                source="VIIRS_SNPP_NRT",
                bbox=[-140, 24, -50, 72],
                days=2,
                enable_clustering=clustering_config['enable_clustering'],
                cluster_distance_km=clustering_config['cluster_distance_km'],
                return_both=True
            )
            
            # Store both versions in the database
            wildfire_document = {
                "lastUpdated": current_time.isoformat(),
                "originalData": nasa_data["original"],          # Full NASA data
                "clusteredData": nasa_data["clustered"],        # Optimized for frontend
                "clusteringMetadata": {
                    "enabled": nasa_data["clustering_enabled"],
                    "distance_km": nasa_data["cluster_distance_km"],
                    "original_count": nasa_data["original_count"],
                    "clustered_count": nasa_data["clustered_count"],
                    "reduction_percent": round(((nasa_data["original_count"] - nasa_data["clustered_count"]) / nasa_data["original_count"] * 100), 2) if nasa_data["original_count"] > 0 else 0
                },
                "source": "NASA_VIIRS_SNPP_NRT",
                "bbox": [-140, 24, -50, 72],
                "days": 4,
                "fetchedAt": current_time.isoformat()
            }
            
            # Insert new data (keep all historical entries as backup)
            nasaWildfiresCollection.insert_one(wildfire_document)
            print(f"Updated wildfire database with {nasa_data['original_count']} original features, {nasa_data['clustered_count']} clustered features")
            
            # Return the clustered data to the client (optimized payload)
            return jsonify(nasa_data["clustered"]), 200, {'Content-Type': 'application/json'}
            
    except Exception as e:
        print(f"Error in getNasaWildfires: {str(e)}")
        # Fallback: try to return any available data from database
        try:
            # Use limit(1) for fallback as well
            fallback_cursor = nasaWildfiresCollection.find({}).sort([("lastUpdated", -1)]).limit(1)
            fallback_data = None
            for doc in fallback_cursor:
                fallback_data = doc
                break
                
            if fallback_data:
                # Return clustered data if available, otherwise legacy data
                if "clusteredData" in fallback_data:
                    return jsonify(fallback_data["clusteredData"]), 200, {'Content-Type': 'application/json'}
                elif "geojsonData" in fallback_data:
                    return jsonify(fallback_data["geojsonData"]), 200, {'Content-Type': 'application/json'}
        except Exception as fallback_error:
            print(f"Fallback also failed: {str(fallback_error)}")
        
        return jsonify({"error": "Failed to fetch wildfire data", "message": str(e)}), 500


@app.route('/wildfires/nasa/refresh', methods=['POST'])
def refreshNasaWildfires():
    """Force refresh wildfire data from NASA API"""
    try:
        print("Force refreshing wildfire data from NASA API")
        nasa_data = fetch_nasa_geojson(
            map_key=mapbox_api,
            source="VIIRS_SNPP_NRT",
            bbox=[-140, 24, -50, 72],
            days=2,
            enable_clustering=clustering_config['enable_clustering'],
            cluster_distance_km=clustering_config['cluster_distance_km'],
            return_both=True
        )
        
        current_time = datetime.datetime.now()
        wildfire_document = {
            "lastUpdated": current_time.isoformat(),
            "originalData": nasa_data["original"],          # Full NASA data
            "clusteredData": nasa_data["clustered"],        # Optimized for frontend
            "clusteringMetadata": {
                "enabled": nasa_data["clustering_enabled"],
                "distance_km": nasa_data["cluster_distance_km"],
                "original_count": nasa_data["original_count"],
                "clustered_count": nasa_data["clustered_count"],
                "reduction_percent": round(((nasa_data["original_count"] - nasa_data["clustered_count"]) / nasa_data["original_count"] * 100), 2) if nasa_data["original_count"] > 0 else 0
            },
            "source": "NASA_VIIRS_SNPP_NRT",
            "bbox": [-140, 24, -50, 72],
            "days": 2,
            "fetchedAt": current_time.isoformat(),
            "forceRefresh": True
        }
        
        # Insert new data
        nasaWildfiresCollection.insert_one(wildfire_document)
        print(f"Force updated wildfire database with {nasa_data['original_count']} original features, {nasa_data['clustered_count']} clustered features")
        
        return jsonify({
            "message": "Wildfire data refreshed successfully",
            "original_count": nasa_data["original_count"],
            "clustered_count": nasa_data["clustered_count"],
            "reduction_percent": wildfire_document["clusteringMetadata"]["reduction_percent"],
            "updated_at": current_time.isoformat()
        }), 200
        
    except Exception as e:
        print(f"Error in refreshNasaWildfires: {str(e)}")
        return jsonify({"error": "Failed to refresh wildfire data", "message": str(e)}), 500


##################### AQI Data #####################

@app.route('/aq/openweather/latest', methods=['GET'])
def api_openweather_latest():
    """
    Fetch latest OpenWeather AQI data from database (returns pre-formatted GeoJSON).
    No processing - returns originalData directly.
    """
    try:
        # Get the latest OpenWeather AQI data from database
        latest_data_cursor = aqiCollection.find({}).sort([("lastUpdated", -1)]).limit(1)
        latest_data = None
        for doc in latest_data_cursor:
            latest_data = doc
            break
            
        if not latest_data:
            return jsonify({"error": "No OpenWeather AQI data found"}), 404
            
        # Return the original data directly (already in GeoJSON format)
        original_data = latest_data.get("originalData", {})
        
        if not original_data:
            return jsonify({"error": "No original data found"}), 404
            
        return jsonify(original_data), 200, {'Content-Type': 'application/json'}
        
    except Exception as e:
        print(f"Error in api_openweather_latest: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch OpenWeather AQI data", "details": str(e)}), 500


@app.route('/aq/openaq/latest', methods=['GET'])
def api_openaq_latest():
    """
    Fetch OpenAQ v3 latest PM2.5 within a bbox, convert to AQI, filter by min_aqi, return GeoJSON.
    Query params:
      bbox=minLon,minLat,maxLon,maxLat   (required)
      min_aqi=50                         (optional)
      limit=1000                         (optional)
      page=1                             (optional)
    """
    bbox = request.args.get('bbox')
    
    if not bbox:
        return jsonify({"error": "Missing bbox=minLon,minLat,maxLon,maxLat"}), 400
    try:
        minx, miny, maxx, maxy = [float(x) for x in bbox.split(',')]
    except Exception:
        return jsonify({"error": "Invalid bbox format"}), 400
    
    min_aqi = int(request.args.get('min_aqi', 0))
    limit = int(request.args.get('limit', 10000))
    page = int(request.args.get('page', 5))

    try:
        # Use the parameters/2/latest endpoint via openaq_param_pm25_latest function
        print(f"Requesting OpenAQ data with limit={limit}, page={page}")
        payload = openaq_param_pm25_latest(limit=limit, page=page)
        print(f"Fetched OpenAQ data using parameters/2/latest endpoint")
        
        if isinstance(payload, dict) and "results" in payload:
            print(f"Found {len(payload['results'])} results in payload")
            if payload["results"]:
                print(f"Sample data: {payload['results'][0]}")
                
        fc = openaq_param_latest_to_geojson_aqi(
            payload,
            min_aqi=min_aqi,
            bbox=(-170, 5, -50, 85)
        )
        feature_count = len(fc.get('features', []))
        print(f"Converted to GeoJSON with {feature_count} features")
        
        # Add debug information to response
        if feature_count == 0:
            print("Warning: No features found after filtering")
            
        return jsonify(fc), 200
    except requests.HTTPError as e:
        print(f"OpenAQ HTTP error: {e}")
        body = getattr(e, 'response', None).text if hasattr(e, 'response') and e.response is not None else None
        return jsonify({"error": "OpenAQ HTTP error", "details": str(e), "body": body}), 502
    except Exception as e:
        print(f"Error in api_openaq_latest: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Failed to fetch/convert OpenAQ data", "details": str(e)}), 500

@app.route('/aq/convert/pm25', methods=['POST'])
def api_convert_pm25_list():
    """
    Convert a JSON list of PM2.5 measurements to AQI.
    Body: { "values": [12.0, 35.5, ...] }
    Returns: { "aqi": [..] }
    """
    data = request.get_json(silent=True) or {}
    values = data.get('values')
    if not isinstance(values, list):
        return jsonify({"error": "Body must include list 'values'"}), 400
    aqi_list = [pm25_to_aqi(v) for v in values]
    return jsonify({"aqi": aqi_list}), 200



##################### Health Check Endpoint #####################

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify server status"""
    try:
        # Perform a simple database operation to check connectivity
        db.command("ping")
        return jsonify({"status": "ok"}), 200
    except Exception as e:
        print(f"Health check failed: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/wildfires/nasa/original', methods=['GET'])
def getNasaWildfiresOriginal():
    """Get the original (non-clustered) NASA wildfire data"""
    try:
        # Get the latest data from database using limit(1)
        latest_data_cursor = nasaWildfiresCollection.find({}).sort([("lastUpdated", -1)]).limit(1)
        latest_data = None
        for doc in latest_data_cursor:
            latest_data = doc
            break
        
        if not latest_data:
            return jsonify({"error": "No wildfire data available"}), 404
        
        # Return original data if available
        if "originalData" in latest_data:
            original_data = latest_data["originalData"]
            metadata = latest_data.get("clusteringMetadata", {})
            
            return jsonify({
                "data": original_data,
                "metadata": {
                    "original_count": metadata.get("original_count", len(original_data.get("features", []))),
                    "last_updated": latest_data.get("lastUpdated"),
                    "source": latest_data.get("source", "NASA_VIIRS_SNPP_NRT"),
                    "note": "This is the complete, unfiltered NASA FIRMS data"
                }
            }), 200
        else:
            # Fallback for legacy data structure
            legacy_data = latest_data.get("geojsonData", {
                "type": "FeatureCollection",
                "features": []
            })
            return jsonify({
                "data": legacy_data,
                "metadata": {
                    "original_count": len(legacy_data.get("features", [])),
                    "last_updated": latest_data.get("lastUpdated"),
                    "source": latest_data.get("source", "NASA_VIIRS_SNPP_NRT"),
                    "note": "Legacy data format - clustering not available"
                }
            }), 200
            
    except Exception as e:
        print(f"Error in getNasaWildfiresOriginal: {str(e)}")
        return jsonify({"error": "Failed to fetch original wildfire data", "message": str(e)}), 500

@app.route('/wildfires/clustering/stats', methods=['GET'])
def get_clustering_stats():
    """Get clustering statistics from the latest dataset"""
    try:
        # Use limit(1) for consistency
        latest_data_cursor = nasaWildfiresCollection.find({}).sort([("lastUpdated", -1)]).limit(1)
        latest_data = None
        for doc in latest_data_cursor:
            latest_data = doc
            break
        
        if not latest_data:
            return jsonify({"error": "No wildfire data available"}), 404
        
        if "clusteringMetadata" in latest_data:
            metadata = latest_data["clusteringMetadata"]
            return jsonify({
                "clustering_enabled": metadata.get("enabled", False),
                "cluster_distance_km": metadata.get("distance_km", 0),
                "original_count": metadata.get("original_count", 0),
                "clustered_count": metadata.get("clustered_count", 0),
                "reduction_percent": metadata.get("reduction_percent", 0),
                "data_saved": f"{metadata.get('reduction_percent', 0):.1f}% reduction in payload size",
                "last_updated": latest_data.get("lastUpdated"),
                "current_config": clustering_config
            }), 200
        else:
            # Legacy data without clustering metadata
            features_count = len(latest_data.get("geojsonData", {}).get("features", []))
            return jsonify({
                "clustering_enabled": False,
                "original_count": features_count,
                "clustered_count": features_count,
                "reduction_percent": 0,
                "note": "Legacy data format - clustering metadata not available",
                "last_updated": latest_data.get("lastUpdated"),
                "current_config": clustering_config
            }), 200
            
    except Exception as e:
        print(f"Error in get_clustering_stats: {str(e)}")
        return jsonify({"error": "Failed to fetch clustering statistics", "message": str(e)}), 500

# Global clustering configuration
clustering_config = {
    "enable_clustering": True,
    "cluster_distance_km": 0.2
}

@app.route('/wildfires/clustering/config', methods=['GET'])
def get_clustering_config():
    """Get current clustering configuration."""
    return jsonify(clustering_config), 200

@app.route('/wildfires/clustering/config', methods=['POST'])
def set_clustering_config():
    """Update clustering configuration."""
    try:
        data = request.get_json()
        
        if 'enable_clustering' in data:
            clustering_config['enable_clustering'] = bool(data['enable_clustering'])
        
        if 'cluster_distance_km' in data:
            distance = float(data['cluster_distance_km'])
            if distance > 0:
                clustering_config['cluster_distance_km'] = distance
            else:
                return jsonify({"error": "cluster_distance_km must be positive"}), 400
        
        return jsonify({
            "message": "Clustering configuration updated",
            "config": clustering_config
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400






if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=True)



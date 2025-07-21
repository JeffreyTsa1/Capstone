from flask import Flask, request, jsonify, Response
from flask_restful import Resource, Api, reqparse

from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient

import json
from bson import json_util, ObjectId
import pandas as pd
import numpy as np
import datetime
import random
import re
import os
import smtplib
import ssl

sampleReportSchema = {
  "id": "report_01H6XZ1234567890ABCDEF",  
  "userId": "user_9f8d7e6a5b4c3d2e1f0a",  
  "location": {
    "latitude": 49.2827,
    "longitude": -123.1207,
    "accuracy": 10
  },
  "radiusMeters": 250,
  "type": "smoke",
  "severity": "moderate",
  "description": "Dense smoke visible from Stanley Park.",
  "photos": [
    "https://storage.yourapp.com/photos/report_01/photo_001.jpg"
  ],
  "confirmations": [{
    "userId": "user_9f8d7e6a5b4c3d2e1f0a",
    "confirmed": True,
    "confirmedAt": null,
    "confirmedBy": null,
    "severity": "moderate",
    "description": "Dense smoke visible from Stanley Park."
  }],
  "metadata": {
    "schemaVersion": "1.0",
    "source": "web-app",
    "deviceInfo": {
      "deviceType": "iPhone 15",
      "osVersion": "iOS 18.0.2"
    }
  },
  "timestamp": "2025-07-17T20:35:00Z",
  "syncedAt": "2025-07-17T21:00:00Z"
}


from pprint import PrettyPrinter

app = Flask(__name__)
load_dotenv()
CORS(app)
# cluster = "mongodb+srv://jeffreytsai:<password>@cluster0.w6pa0.mongodb.net/?retryWrites=true&w=majority"
# cluster = f'mongodb+srv://jeffreymytsai:V6BcdwNiEyrUzjLC@cluster1.ohhnpqc.mongodb.net/?retryWrites=true&w=majority&appName=Cluster1'
# client = MongoClient(cluster)

# db = client.Assets

# reportCollection = db.Reports
# requestCollection = db.PayoutRequests
# userCollection = db.Users
# userCollection.create_index([("email")])

@app.route("/")
def hello_world():
    # print(companyCollection.find())
    return "<p>Hello, World!</p>"


@app.route('/report/all', methods=['GET'])
def getAllReports():
    print("Test")
    # reports = reportCollection.find({})
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
def createReport(userId=None, location=None, radiusMeters=250, indicator="smoke", severity="moderate", description=None, photos=None, submittedAt=None, metadata=None):

    newReportObject = {
        "userId": userId,
        "location": {
            "latitude": location.get("latitude", 0.0),
            "longitude": location.get("longitude", 0.0),
            "accuracy": location.get("accuracy", 10)
  },
  "radiusMeters": radiusMeters,
  "indicator": indicator,
  "severity": severity,
  "description": description,
  "photos": photos,
  "confirmations": [{
    "confirmed": True,
    "confirmedAt": datetime.datetime.utcnow().isoformat(),
    "confirmedBy": userId,
    "severity": "moderate",
    "description": "Dense smoke visible from Stanley Park."
  }],
  "metadata": metadata,
  "submittedAt": submittedAt,
  "syncedAt": datetime.datetime.utcnow().isoformat()
}

@app.route('/wildfires', methods=['GET'])
def getWildfires():
    # Fetch wildfires data from the database
    wildfires = []  # Replace with actual database query

    # return geojson
    if not wildfires:
        return jsonify({"error": "No wildfires found"}), 404
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

if __name__ == '__main__':
    app.run(debug=True)
    
    

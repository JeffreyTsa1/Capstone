"use client";
import React from 'react';
import './AQIPopup.css';

const AQIPopup = ({ data }) => {
  if (!data) return null;

  // Helper function to get color based on AQI value
  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#00e400';          // Good
    if (aqi <= 100) return '#ffe02e';         // Moderate
    if (aqi <= 150) return '#ff7e00';         // Unhealthy for Sensitive Groups
    if (aqi <= 200) return '#ff0000';         // Unhealthy
    if (aqi <= 300) return '#8f3f97';         // Very Unhealthy
    return '#7e0023';                         // Hazardous
  };

  // Helper function to get health recommendation based on AQI
  const getHealthRecommendation = (aqi) => {
    if (aqi <= 50) return 'Air quality is good. Enjoy outdoor activities.';
    if (aqi <= 100) return 'Air quality is acceptable. Unusually sensitive individuals should consider limiting prolonged outdoor exertion.';
    if (aqi <= 150) return 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
    if (aqi <= 200) return 'Some members of the general public may experience health effects. Sensitive groups may experience more serious effects.';
    if (aqi <= 300) return 'Health alert: The risk of health effects is increased for everyone. Avoid prolonged outdoor activities.';
    return 'Health warning of emergency conditions: everyone should avoid all physical activity outdoors.';
  };

  // Helper function to get category name based on AQI
  const getCategory = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const aqiValue = data.properties.aqi || 0;
  const color = getAQIColor(aqiValue);
  const textColor = aqiValue > 150 ? '#ffffff' : '#000000';
  const category = getCategory(aqiValue);
  const recommendation = getHealthRecommendation(aqiValue);
  
  // Format date if available
  const dateString = data.properties.datetime 
    ? new Date(data.properties.datetime).toLocaleString()
    : 'Not available';

  return (
    <div className="aqi-popup-container">
      <div className="aqi-popup-header" style={{ backgroundColor: color, color: textColor  }}>
        <h3>Air Quality Index</h3>
        <div className="aqi-value">{aqiValue}</div>
      </div>
      <div className="aqi-popup-content">
        <div className="aqi-info-row">
          <span className="aqi-label">Category:</span>
          <span className="aqi-data">{category}</span>
        </div>
        <div className="aqi-info-row">
          <span className="aqi-label">Location:</span>
          <span className="aqi-data">{data.properties.name || 'Unknown Location'}</span>
        </div>
        <div className="aqi-info-row">
          <span className="aqi-label">Time:</span>
          <span className="aqi-data">{dateString}</span>
        </div>
        <div className="aqi-recommendation">
          <h4>Health Advisory:</h4>
          <p>{recommendation}</p>
        </div>
      </div>
    </div>
  );
};

export default AQIPopup;

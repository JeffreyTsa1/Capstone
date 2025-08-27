"use client";
import React from 'react';
import { motion } from 'motion/react';
import './AQILegend.css';

const AQILegend = ({ visible = true }) => {
  // AQI level ranges and their descriptions
  const aqiLevels = [
    { range: '0-50', label: 'Good', color: '#00e400', description: 'Air quality is satisfactory, and air pollution poses little or no risk.' },
    { range: '51-100', label: 'Moderate', color: '#ffff00', description: 'Air quality is acceptable. However, some pollutants may be a concern for a small number of people.' },
    { range: '101-150', label: 'Unhealthy for Sensitive Groups', color: '#ff7e00', description: 'Members of sensitive groups may experience health effects.' },
    { range: '151-200', label: 'Unhealthy', color: '#ff0000', description: 'Everyone may begin to experience health effects.' },
    { range: '201-300', label: 'Very Unhealthy', color: '#8f3f97', description: 'Health alert: The risk of health effects is increased for everyone.' },
    { range: '301+', label: 'Hazardous', color: '#7e0023', description: 'Health warning of emergency conditions: everyone is more likely to be affected.' },
  ];

  if (!visible) return null;

  return (
    <motion.div 
      className="aqi-legend"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="legend-header">
        <h3>Air Quality Index (AQI)</h3>
        <span className="legend-subtitle">EPA Standard</span>
      </div>
      <div className="legend-items">
        {aqiLevels.map((level, index) => (
          <div key={index} className="legend-item">
            <div className="legend-color-box" style={{ backgroundColor: level.color }}></div>
            <div className="legend-details">
              <div className="legend-range-label">
                <span className="legend-range">{level.range}</span>
                <span className="legend-label">{level.label}</span>
              </div>
              <span className="legend-description">{level.description}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="legend-footer">
        <a href="https://www.airnow.gov/aqi/aqi-basics/" target="_blank" rel="noopener noreferrer">
          Learn more about AQI
        </a>
      </div>
    </motion.div>
  );
};

export default AQILegend;

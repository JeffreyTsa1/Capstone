"use client";
import React from 'react';
import { motion } from 'motion/react';
import './WildfireLegend.css';

const WildfireLegend = ({ visible = true }) => {
  if (!visible) return null;

  return (
    <motion.div 
      className="wildfire-legend"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="legend-header">
        <h3>Wildfire Heatmap</h3>
        <span className="legend-subtitle">NASA FIRMS Data</span>
      </div>
      <div className="legend-gradient">
        <div className="gradient-bar"></div>
        <div className="gradient-labels">
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
      <div className="legend-info">
        <p>Heat signature intensity from NASA's Fire Information for Resource Management System (FIRMS).</p>
      </div>
      <div className="legend-footer">
        <a href="https://firms.modaps.eosdis.nasa.gov/" target="_blank" rel="noopener noreferrer">
          Learn more about FIRMS
        </a>
      </div>
    </motion.div>
  );
};

export default WildfireLegend;

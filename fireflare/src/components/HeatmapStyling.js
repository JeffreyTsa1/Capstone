import { FeatureCollection, Feature, Point } from 'geojson';
import { LayerProps } from 'react-map-gl/mapbox';
import { useMemo } from 'react';
// import { FeatureCollection } from "geojson";

const MAX_ZOOM_LEVEL = 18;

export const heatmapLayer = {
  id: 'wildfire-heatmap',
  type: 'heatmap',
  source: 'wildfires', // must match source name
  maxzoom: MAX_ZOOM_LEVEL,
  paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 8, 10, 1.5],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 5, 12, 12, 30],
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(255, 237, 204, 0)',       // very light tan, transparent
      0.2, 'rgba(255, 89, 0, 0.9)',   // more intense soft sand orange
      0.4, 'rgba(255, 132, 0, 0.95)',    // more intense orange
      0.6, 'rgba(255, 153, 0, 0.95)',     // more intense burnt orange
      0.8, 'rgba(252, 188, 12, 1)',      // deep ember red
      1, 'rgba(255, 218, 115, 1)'          // dark fire red
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 8, MAX_ZOOM_LEVEL, 28],
    'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, MAX_ZOOM_LEVEL, .4]
  }
};
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
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 5, 10, 1],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 5, 8, 12, 20],
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(255, 237, 204, 0)',       // very light tan, transparent
      0.2, 'rgba(255, 208, 138, 0.8)',   // soft sand orange
      0.4, 'rgba(255, 153, 0, 0.85)',    // orange
      0.6, 'rgba(255, 94, 0, 0.85)',     // burnt orange
      0.8, 'rgba(192, 38, 0, 0.9)',      // deep ember red
      1, 'rgba(128, 0, 0, 1)'          // dark fire red
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 5, MAX_ZOOM_LEVEL, 22],
    'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, MAX_ZOOM_LEVEL, .2]
  }
};
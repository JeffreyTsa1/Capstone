import {FeatureCollection, Feature, Point} from 'geojson';
import {LayerProps} from 'react-map-gl/mapbox';
import {useMemo} from 'react';
// import { FeatureCollection } from "geojson";

const MAX_ZOOM_LEVEL = 9;

export const heatmapLayer = {
  id: 'wildfire-heatmap',
  type: 'heatmap',
  source: 'wildfires', // must match source name
  maxzoom: 9,
  paint: {
    'heatmap-weight': ['interpolate', ['linear'], ['get', 'mag'], 0, 0, 100000, 1],
    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
    'heatmap-color': [
      'interpolate', ['linear'], ['heatmap-density'],
      0, 'rgba(33,102,172,0)',
      0.2, 'rgb(103,169,207)',
      0.4, 'rgb(209,229,240)',
      0.6, 'rgb(253,219,199)',
      0.8, 'rgb(239,138,98)',
      0.9, 'rgb(255,201,101)'
    ],
    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
    'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0]
  }
};
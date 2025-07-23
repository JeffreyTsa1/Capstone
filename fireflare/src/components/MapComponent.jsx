"use client";

import mapboxgl from "mapbox-gl";
import MapGL, { Layer, NavigationControl, GeolocateControl,Source, Map, useMap, Popup } from "react-map-gl/mapbox";
// import { Map, Marker, NavigationControl, GeolocateControl } from "react-map-gl";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapComponent.css";
import {heatmapLayer} from './HeatmapStyling';
// import { useUser } from "@auth0/nextjs-auth0";

const MapComponent = () => {
  // const { user, isLoading, error } = useUser();
  const [userDefinedLocation, setUserDefinedLocation] = useState(null);
  // const [showOnboarding, setShowOnboarding] = useState(false);
  const [popupInfo, setPopupInfo] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: -95.4460,
    latitude: 43.4436,
    zoom: 4,
  });
  const [earthquakes, setEarthquakes] = useState({
  "type": "FeatureCollection",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "wf202501",
        "mag": 23448,
        "start": 1736227200000,
        "contained": 1737679200000,
        "status": "contained"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-118.512, 34.041, 0]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "wf202502",
        "mag": 14021,
        "start": 1736227200000,
        "contained": 1737679200000,
        "status": "contained"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-118.141, 34.177, 0]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "wf202503",
        "mag": 39000,
        "start": 1721625600000,
        "contained": 1733174400000,
        "status": "extinguished"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-118.035, 52.873, 0]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "wf202504",
        "mag": 8620,
        "start": 1736803200000,
        "contained": null,
        "status": "active"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-119.753, 37.865, 0]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "id": "wf202505",
        "mag": 12100,
        "start": 1736361600000,
        "contained": null,
        "status": "active"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [-123.3656, 48.4284, 0]
      }
    }
  ]
});


  // Default location (San Francisco)
  const defaultLongitude = -122.4194;
  const defaultLatitude = 37.7749;
  const defaultZoom = 12;

  // Mapbox token
  const mapboxToken = `pk.eyJ1IjoianRzYTEiLCJhIjoiY2xzZnhvcmZrMWZxZDJqbm9uY3M0NDRzbCJ9.kOxgTXg_72ecCLEVfdPAmg`;

  const mapRef = useRef(null);
  
  const initialViewState = {
    longitude: defaultLongitude,
    latitude: defaultLatitude,
    zoom: defaultZoom,
  };

  const handleMapLoad = useCallback(() => {
    console.log("Map loaded successfully");
    setMapLoaded(true);

    
    // Set the map style to dusk
    if (mapRef.current) {
      // const map = mapRef.current?.getMap();
      // map.addSource('wildfires', {
      //   type: 'geojson',
      //   data: earthquakes
      // });

    // map.addLayer(heatmapLayer);
      // mapRef.current.setConfigProperty('basemap', 'lightPreset', 'dusk');
    }
  }, [earthquakes]);

  // Example dummy markers for testing
  useEffect(() => {
    // Fetch geojson data for wildfires
    // fetch('/api/wildfires').then(response => response.json())
    //   .then(data => {
    //     console.log("Wildfire data loaded:", data);
    //     // Assuming data is in the format of a GeoJSON FeatureCollection
    //     if (mapRef.current) {
    //       mapRef.current.getSource('wildfires').setData(data);
    //     }
    //   })
    //   .catch(error => {
    //     console.error("Error loading wildfire data:", error);
    //   }
    // );  
    
  }, []);

  // const centerMap = (newLongitude, newLatitude, newZoomLevel) => {
  //   console.log("Centered the map to: " + newLongitude + ", " + newLatitude + ", zoom: " + newZoomLevel);
  //   if (mapRef.current) {
  //     mapRef.current.flyTo({
  //       center: [newLongitude, newLatitude],
  //       essential: true,
  //       zoom: newZoomLevel,
  //       speed: 2.5
  //     });
  //   }
  // };

  // const data = useMemo(() => {
  //   return allDays ? earthquakes : filterFeaturesByDay(earthquakes, selectedTime);
  // }, [earthquakes, allDays, selectedTime]);


    const data = useMemo(() => {
    return earthquakes }, [earthquakes]);

  return (
    <div className="map_wrapper">
      <div className="location_overlay">
        Longitude: {viewState.longitude.toFixed(4)} | Latitude: {viewState.latitude.toFixed(4)} | Zoom: {viewState.zoom.toFixed(2)}
      </div>
      {!mapLoaded && (
        <div className="map-loading">
          Loading map...
        </div>
      )}
      
      <MapGL
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        ref={mapRef}
        style={{
          width: '100vw',
          height: '100vh',
        }}
        mapboxAccessToken={mapboxToken}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        // mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        pitch={10}
        onLoad={handleMapLoad}
        initialViewState={initialViewState}
        maxZoom={20}
        minZoom={3}
      >
        {/* Navigation controls */}
        <NavigationControl position="top-right" />
        <GeolocateControl 
          position="top-right" 
          positionOptions={{ enableHighAccuracy: true }}
          trackUserLocation={true}
        />
          {/* {data && (
          <Source id="wildfires" type="geojson" data={data}>
            <Layer {...heatmapLayer} />
          </Source>
        )} */}
        
      {mapLoaded && (
          <Source id="wildfires" type="geojson" data={earthquakes}>
            <Layer {...heatmapLayer} />
          </Source>
        )} 


        {/* Render markers
        {markers.map(marker => (
          <Marker
            key={marker.id}
            longitude={marker.addressLngLat[0]}
            latitude={marker.addressLngLat[1]}
            onClick={() => console.log(`Clicked marker: ${marker.name}`)}
          />
        ))} */}
      </MapGL>
      
      {/* Additional controls could go here */}
      <div className="map_controls">
        <h3>FireFlare Map</h3>
      </div>
    </div>
  );
};

export default MapComponent;

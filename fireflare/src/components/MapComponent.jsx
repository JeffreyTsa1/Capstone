"use client";

import mapboxgl from "mapbox-gl";
import MapGL, { Layer, Marker, NavigationControl, GeolocateControl,Source, Popup } from "react-map-gl/mapbox";
// import { Map, Marker, NavigationControl, GeolocateControl } from "react-map-gl";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapComponent.css";
import {heatmapLayer} from './HeatmapStyling';
// import { useUser } from "@auth0/nextjs-auth0";

const MapComponent = ({ isReporting, setReportMarker, onMarkerDrop, isOnline }) => {
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
  const [marker, setMarker] = useState(null);
  const [earthquakes, setEarthquakes] = useState(null);


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
    fetch('http://127.0.0.1:5000/wildfires/nasa').then(response => response.json())
      .then(data => {
        console.log("Wildfire data loaded:", data);
        // Assuming data is in the format of a GeoJSON FeatureCollection
        setEarthquakes(data);
      })
      .catch(error => {
        console.error("Error loading wildfire data:", error);
      });
  }, []);


  const handleMarkerDrop = useCallback((event) => {
    const { lngLat } = event;
    console.log("Marker dropped at:", lngLat);
    setMarker({longitude: lngLat.lng, latitude: lngLat.lat});
    setReportMarker({longitude: lngLat.lng, latitude: lngLat.lat, id: Date.now(), name: "New Marker"});
  })

  const handleDragEnd = useCallback((event) => {
    setMarker({ longitude: event.lngLat.lng, latitude: event.lngLat.lat })
  }, [])
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
        onClick={handleMarkerDrop}
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

        {/* Render markers */}
        { marker && isReporting &&
                  <Marker
            key={marker.id}
            longitude={marker.longitude}
            latitude={marker.latitude}
            draggable
            onDragEnd={handleDragEnd}
            onClick={() => console.log(`Clicked marker: ${marker.name}`)}
          />


        }        
      </MapGL>
      
      {/* Additional controls could go here */}
      {/* <div className="map_controls">
        <h3>FireFlare Map</h3>
      </div> */}
    </div>
  );
};

export default MapComponent;

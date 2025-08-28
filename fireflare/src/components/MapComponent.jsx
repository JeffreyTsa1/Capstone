"use client";
import { appStore } from "../../store/Store";
import mapboxgl from "mapbox-gl";
import MapGL, { Layer, Marker, NavigationControl, GeolocateControl, Source, Popup } from "react-map-gl/mapbox";
// import { Map, Marker, NavigationControl, GeolocateControl } from "react-map-gl";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapComponent.css";
import Link from "next/link";
import { heatmapLayer } from './HeatmapStyling';
import { useUser } from "@auth0/nextjs-auth0"
import Onboarding from "./Onboarding";
import { AnimatePresence, motion } from "motion/react";
import ModeratorOverlay from "./overlays/ModeratorOverlay";
import UserOverlay from "./UserOverlay";
import UserReportsOverlay from "./overlays/UserReportsOverlay";
import ReportPopup from "./popups/ReportPopup";
import AQILegend from "./AQILegend";
import WildfireLegend from "./WildfireLegend";
import AQIPopup from "./popups/AQIPopup";
import { checkUserInDatabase } from "../lib/api";
import { ReactServerDOMTurbopackClient } from "next/dist/server/route-modules/app-page/vendored/ssr/entrypoints";

// import { useUser } from "@auth0/nextjs-auth0";

const MapComponent = ({ isReporting, setReportMarker, setRadius }) => {
  const setUser = appStore((state) => state.setUser);
  const { user, isLoading, error } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userExistsInDB, setUserExistsInDB] = useState(null);
  const [checkingUser, setCheckingUser] = useState(false);
  const [userData, setUserData] = useState(null);
  const [moderator, setModerator] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewState, setViewState] = useState({
    longitude: -95.4460,
    latitude: 43.4436,
    zoom: 4,
  });
  const [verifiedReports, setVerifiedReports] = useState([]);
  const [unverifiedReports, setUnverifiedReports] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [marker, setMarker] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  // const [reportMarker, setReportMarkerState] = useState(null);
  // const [userMarker, setUserMarker] = useState(null);
  const [wildfires, setWildfires] = useState(null);
  const [radiusMeters, setRadiusMeters] = useState(1000); // Default radius in meters
  
  // 1) state to hold AQ geojson
  const [aqGeoJSON, setAqGeoJSON] = useState({ type: 'FeatureCollection', features: [] });
  
  // Helper function to safely access localStorage (only in browser)
  const getLocalStorageItem = (key, defaultValue) => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(key);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    }
    return defaultValue;
  };
  
  // Initialize state from localStorage or use defaults
  const [showAQILegend, setShowAQILegend] = useState(() => 
    getLocalStorageItem('showAQILegend', false)
  );
  
  const [showWildfireLegend, setShowWildfireLegend] = useState(() => 
    getLocalStorageItem('showWildfireLegend', false)
  );
  
  const [showWildfireLayer, setShowWildfireLayer] = useState(() => 
    getLocalStorageItem('showWildfireLayer', true)
  ); 
  
  const [showAQILayer, setShowAQILayer] = useState(() => 
    getLocalStorageItem('showAQILayer', true)
  );
  
  // State for AQI popup
  const [selectedAQI, setSelectedAQI] = useState(null);

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

// 2) helper to build bbox from the map
const getBbox = useCallback(() => {
  const map = mapRef.current?.getMap?.();
  if (!map) return null;
  const [[minX, minY], [maxX, maxY]] = map.getBounds().toArray();
  return [minX, minY, maxX, maxY];
}, []);

  // 3) fetch function (debounced)
const fetchAQ = useCallback(async () => {
  const bbox = getBbox();
  if (!bbox) return;
  const url = `${process.env.NEXT_PUBLIC_API_URL}/aq/openaq/latest?bbox=${bbox.join(',')}&min_aqi=50&limit=1000`;
  const res = await fetch(url);
  if (!res.ok) return;
  const fc = await res.json();
  console.log("Fetched AQ data:", fc);
  setAqGeoJSON(fc);
}, [getBbox]);

// Handle clicking on AQ markers
const handleMapClick = useCallback((event) => {
  if (!isReporting) {
    const map = mapRef.current.getMap();
    const features = map.queryRenderedFeatures(event.point, { layers: ['aq-markers'] });
    
    if (features.length) {
      const clickedFeature = features[0];
      setSelectedAQI(clickedFeature);
    }
  }
}, [isReporting]);// 4) kick off on load, and on moveend

  const memoizedSetUserMenuOpen = useCallback(setUserMenuOpen, []);
  const memoizedUserData = useMemo(() => userData, [userData]);
  
  // Helper function to safely set localStorage (only in browser)
  const setLocalStorageItem = useCallback((key, value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, []);
  
  // Custom state setters that also update localStorage
  const updateShowAQILegend = useCallback((value) => {
    setShowAQILegend(value);
    setLocalStorageItem('showAQILegend', value);
  }, [setLocalStorageItem]);
  
  const updateShowWildfireLegend = useCallback((value) => {
    setShowWildfireLegend(value);
    setLocalStorageItem('showWildfireLegend', value);
  }, [setLocalStorageItem]);
  
  const updateShowAQILayer = useCallback((value) => {
    setShowAQILayer(value);
    setLocalStorageItem('showAQILayer', value);
  }, [setLocalStorageItem]);
  
  const updateShowWildfireLayer = useCallback((value) => {
    setShowWildfireLayer(value);
    setLocalStorageItem('showWildfireLayer', value);
  }, [setLocalStorageItem]);
  const centerMap = useCallback((newLongitude, newLatitude, newZoomLevel) => {
    console.log("Centered the map to: " + newLongitude + ", " + newLatitude + ", zoom: " + newZoomLevel);
    mapRef.current?.flyTo({
      center: [newLongitude, newLatitude],
      essential: true,
      zoom: newZoomLevel,
      speed: 2.5
    });
  }, []);
  
  const handleMapLoad = useCallback(() => {
    console.log("Map loaded successfully");
    setMapLoaded(true);


    // Set the map style to dusk
    if (mapRef.current) {
      // const map = mapRef.current?.getMap();
      // map.addSource('wildfires', {
      //   type: 'geojson',
      //   data: wildfires
      // });

      // map.addLayer(heatmapLayer);
      // mapRef.current.setConfigProperty('basemap', 'lightPreset', 'dusk');
    }
  }, []);

  const fetchReports = useCallback(async () => {

        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/all`)
      .then(response => response.json())
      .then(data => {
        console.log("Reports data loaded:", data);

        const verified = data.reports.filter(report => report.isVerified === true);
        const unverified = data.reports.filter(report => report.isVerified === false);
        console.log("Verified reports:", verified);
        setUnverifiedReports(unverified); 
        setVerifiedReports(verified);

      })
      .catch(error => {
        console.error("Error loading reports data:", error);
      }
    );
  }, []);
  // Check if user exists in database when Auth0 user is loaded
  useEffect(() => {
    const verifyUser = async () => {
      // Only check if we have a user from Auth0 and haven't checked yet
      if (!user || isLoading || checkingUser || userExistsInDB !== null) return;
      
      setCheckingUser(true);
      
      try {
        // Use the refactored helper function
        const result = await checkUserInDatabase(user.sub);
        
        if (result.exists) {
          setUserExistsInDB(true);
          setModerator(result.isModerator || false);
          setUser(result.user);
          setUserData(result.user);
          setShowOnboarding(false);
        } else {
          // User doesn't exist in database - show onboarding
          setUserExistsInDB(false);
          setShowOnboarding(true);
          console.log("User not found in database, showing onboarding");
        }
      } catch (error) {
        console.error("Error during user verification:", error);
        // On error, assume user doesn't exist and show onboarding
        setUserExistsInDB(false);
        setShowOnboarding(true);
      } finally {
        setCheckingUser(false);
      }
    };
    
    verifyUser();

    // Load air quality data only once when map is loaded
    const map = mapRef.current?.getMap?.();
    if (!map) return;
    
    const onLoad = () => {
      // Only fetch AQ data once on initial load
      fetchAQ();
    };
    
    if (map.isStyleLoaded()) onLoad();
    else map.once('load', onLoad);

    // No longer attach to moveend event to prevent multiple API calls

  }, [fetchAQ, user, isLoading, checkingUser, userExistsInDB]);

  useEffect(() => {
    // Fetch geojson data for wildfires
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/wildfires/nasa`).then(response => response.json())
      .then(data => {
        console.log("Wildfire data loaded:", data);
        // Assuming data is in the format of a GeoJSON FeatureCollection
        setWildfires(data);
      })
      .catch(error => {
        console.error("Error loading wildfire data:", error);
      });

    // Fetch all reports
    fetchReports();

  }, []);
  

  // Function to handle onboarding completion
  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setUserExistsInDB(false); // Keep as false so they can be prompted again later
  };

  const handleMarkerDrop = useCallback((event) => {
    console.log("clicked, but not reporting")
    if (!isReporting) return;
    else {
      const { lngLat } = event;
      // alert("Marker dropped at: " + lngLat.lng + ", " + lngLat.lat);
      console.log("Marker dropped at:", lngLat);
      setMarker({ longitude: lngLat.lng, latitude: lngLat.lat });
      setReportMarker({ longitude: lngLat.lng, latitude: lngLat.lat, id: Date.now(), name: "New Marker", radiusMeters });

    }
  }, [ isReporting,setReportMarker, radiusMeters])

  const handleDragEnd = useCallback((event) => {
    const newMarker = { longitude: event.lngLat.lng, latitude: event.lngLat.lat };
    setMarker(newMarker);
    setReportMarker({ ...newMarker, id: Date.now(), name: "New Marker", radiusMeters });
  }, [setReportMarker, radiusMeters])
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
  //   return allDays ? wildfires : filterFeaturesByDay(wildfires, selectedTime);
  // }, [wildfires, allDays, selectedTime]);


  const data = useMemo(() => {
    return wildfires
  }, [wildfires]);
  
  // Function to manually refresh AQ data
  const refreshAirQualityData = useCallback(() => {
    console.log("Manually refreshing air quality data");
    fetchAQ();
  }, [fetchAQ]);

  // Create circle GeoJSON for radius visualization
  const createCircle = useCallback((center, radiusInMeters) => {
    if (!center) return null;

    const points = 64;
    const coords = [];
    const distanceX = radiusInMeters / (111320 * Math.cos(center.latitude * Math.PI / 180));
    const distanceY = radiusInMeters / 110540;

    for (let i = 0; i < points; i++) {
      const theta = (i / points) * (2 * Math.PI);
      const x = distanceX * Math.cos(theta);
      const y = distanceY * Math.sin(theta);
      coords.push([center.longitude + x, center.latitude + y]);
    }
    coords.push(coords[0]); // Close the circle

    return {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: {},
        geometry: {
          type: "Polygon",
          coordinates: [coords]
        }
      }]
    };
  }, []);

  const circleData = useMemo(() => {
    return marker && isReporting ? createCircle(marker, radiusMeters) : null;
  }, [marker, radiusMeters, isReporting, createCircle]);
  // alert(circleData)


  return (
    <div className="mapWrapper">
      <div >
        {/* <pre>
          [Longitude, Latitude] | Zoom
        </pre> */}
        {
          <div className="topLeftOverlay">



              {
                isReporting && user && <>
                <motion.div className="locationOverlay">
                  <div className="locationOverlayHeader">
                    <h2>Current Viewpoint</h2>
                  </div>
                  <div className="locationOverlayContent">
                    <div className="splitRow">
                      <div>
                        <label>Longitude</label>
                        <h5>{viewState.longitude.toFixed(4)}</h5>
                      </div>
                      <div>
                        <label>Latitude</label>
                        <h5>{viewState.latitude.toFixed(4)}</h5>
                      </div>
                      <div>
                        <label>Zoom</label>
                        <h5>{viewState.zoom.toFixed(2)}</h5>
                      </div>
                    </div>
                    <div style={{ marginTop: 16 }}>
                      <h2 >Marker Location</h2>
                      <div className="splitRow">
                        <div>
                          <label>Longitude</label>
                          <h5>{marker ? marker.longitude.toFixed(4) : '--'}</h5>
                        </div>
                        <div>
                          <label>Latitude</label>
                          <h5>{marker ? marker.latitude.toFixed(4) : '--'}</h5>
                        </div>
                      </div>
                      {!marker && <p className="markerWarning">Please place a marker.</p>}
                    </div>
                    <div style={{ marginTop: 10, textAlign: 'center' }}>
                      <label><span style={{fontFamily: 'nexa',fontWeight:600}}>Radius:</span> <span style={{ fontFamily: 'nexa-text',fontSize: '1.25rem' }}>{radiusMeters} m</span></label>
                      <input
                        type="range"
                        min="100"
                        max="10000"
                        step="100"
                        value={radiusMeters}
                        className="radiusSlider"
                        onChange={(e) => {
                          setRadiusMeters(Number(e.target.value));
                          setRadius(Number(e.target.value));
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
                </>
              }
              {
                user && !showOnboarding &&  !isReporting && (
                  <UserOverlay
                    userMenuOpen={userMenuOpen}
                    setUserMenuOpen={setUserMenuOpen}
                    moderator={moderator}
                    userData={memoizedUserData}
                    showAQI={showAQILegend}
                    setShowAQI={updateShowAQILegend}
                    showWildfire={showWildfireLegend}
                    setShowWildfire={updateShowWildfireLegend}
                    setShowAQILayer={updateShowAQILayer}
                    showAQILayer={showAQILayer}
                    showWildfireLayer={showWildfireLayer}
                    setShowWildfireLayer={updateShowWildfireLayer}
                  />
                )
              }
              {
                !user && <>
                  <motion.a href="/auth/login"
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.05 }}
                  className="loginLink">
                    Login
                  </motion.a>
                </>

              }


          </div>
        }
      </div>

      {!mapLoaded && (
        <div className="map-loading">
          Loading map...
        </div>
      )}
      
      {/* Air Quality Refresh Button */}
      {mapLoaded && (
        <div className="map-control air-quality-refresh">
          <button 
            onClick={refreshAirQualityData}
            className="refreshButton"
            title="Refresh Air Quality Data"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6"></path>
              <path d="M1 20v-6h6"></path>
              <path d="M3.51 9a9 9 0 0114.85-3.36L23 10"></path>
              <path d="M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
            </svg>
            {/* <span style={{ marginLeft: '4px' }}>Refresh AQ Data</span> */}
          </button>
        </div>
      )}
      
      {/* Legend Components */}
      {mapLoaded && (
        <>
          <AnimatePresence>
            {showAQILegend && <AQILegend visible={showAQILegend} />}
          </AnimatePresence>
          
          <AnimatePresence>
            {showWildfireLegend && <WildfireLegend visible={showWildfireLegend} />}
          </AnimatePresence>
        </>
      )}

      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <Onboarding 
          user={user}
          setShowOnboarding={setShowOnboarding}
        />
      )}
      {
        moderator && user && !isReporting && (
          <ModeratorOverlay centerMap={centerMap} setCurrentReport={setCurrentReport} unverifiedReports={unverifiedReports} verifiedReports={verifiedReports} />
        )
      }
      
      {/* User Reports Overlay - Only shown for regular users when not reporting */}
      {!moderator && user && !isReporting && (
        <UserReportsOverlay centerMap={centerMap} setCurrentReport={setCurrentReport} verifiedReports={verifiedReports} />
      )}
      {/* Loading indicator for user check */}
      {checkingUser && (
        <div className="user-check-loading" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '4px',
          zIndex: 999,
          fontSize: '14px',
        }}>
          Checking user profile...
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
        // mapStyle="mapbox://styles/mapbox/standard"
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        pitch={10}
        onClick={(e) => {
          // Handle both marker drops and feature clicks
          handleMapClick(e);
          handleMarkerDrop(e);
        }}
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


          {aqGeoJSON && showAQILayer && (
  <Source 
    id="aq-stations" 
    type="geojson" 
    data={aqGeoJSON}
  >
    {/* Heat map layer for better area visualization */}
    <Layer
      id="aq-heatmap"
      type="heatmap"
      paint={{
        // Modified weight scale to prioritize higher AQI values
        'heatmap-weight': [
          'interpolate', ['linear'], ['get', 'aqi'],
          0, 0.1,     // Very low AQI - minimal contribution
          50, 0.2,    // Good - reduced contribution
          100, 0.4,   // Moderate - moderate contribution
          150, 1.0,   // Unhealthy for sensitive groups
          200, 1.7,   // Unhealthy - significant contribution
          300, 2.5,   // Very unhealthy - high contribution  
          500, 3.0    // Hazardous - maximum contribution
        ],
        // Larger radius as we zoom out
        'heatmap-radius': [
          'interpolate', ['linear'], ['zoom'],
          5, 20,
          8, 15,
          12, 10
        ],
        // Color ramp for heatmap based on AQI standards
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,228,0,0)',       // Green (transparent)
          0.1, 'rgba(255,255,0,0.6)', // Yellow (Moderate)
          0.3, 'rgba(255,126,0,0.7)', // Orange (Unhealthy for Sensitive Groups)
          0.5, 'rgba(255,0,0,0.8)',   // Red (Unhealthy)
          0.7, 'rgba(143,63,151,0.8)', // Purple (Very Unhealthy)
          1.0, 'rgba(126,0,35,0.8)',  // Maroon (Hazardous)
        ],
        // Slightly reduced intensity at lower zoom levels to minimize density effect
        'heatmap-intensity': [
          'interpolate', ['linear'], ['zoom'],
          5, 0.8,     // Lower intensity when zoomed out (where density effects are most problematic)
          8, 0.9,     // Medium zoom
          10, 1.0     // Closer zoom (where individual points are more relevant)
        ],
        // Opacity based on zoom level
        'heatmap-opacity': [
          'interpolate', ['linear'], ['zoom'],
          7, 0.9,
          14, 0.6
        ]
      }}
    />
    
    {/* Circle layer for specific station data points */}
    <Layer
      id="aq-markers"
      type="circle"
      minzoom={8} // Only show individual markers when zoomed in
      paint={{
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          4, 6,
          8, 10,
          12, 20,
          16, 18
        ],
        'circle-color': [
          'step', ['get','aqi'],
          '#00e400', 50,    // 0-50 Good (Green)
          '#ffff00', 100,   // 51–100 Moderate (Yellow)
          '#ff7e00', 150,   // 101–150 Unhealthy for Sensitive Groups (Orange)
          '#ff0000', 200,   // 151–200 Unhealthy (Red)
          '#8f3f97', 300,   // 201–300 Very Unhealthy (Purple)
          '#7e0023'         // 300+ Hazardous (Maroon)
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.5,
        'circle-opacity': 0.85
      }}
    />
    
    {/* AQI value labels for higher zoom levels */}
    <Layer
      id="aq-labels"
      type="symbol"
      minzoom={8} // Show labels at slightly lower zoom level
      layout={{
        'text-field': ['to-string', ['get', 'aqi']],
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 20
      }}
      paint={{
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 1
      }}
    />
  </Source>
)}  
        {mapLoaded && showWildfireLayer && (
          <Source key="wildfires-source" id="wildfires" type="geojson" data={wildfires}>
            <Layer key="wildfires-heatmap-layer" {...heatmapLayer} />
          </Source>
        )}

        {/* Render radius circle */}
        {circleData && (
          <Source key="radius-circle-source" id="radius-circle" type="geojson" data={circleData}>
            <Layer
              key="radius-circle-fill-layer"
              id="radius-circle-fill"
              type="fill"
              paint={{
                'fill-color': '#ff6b6b',
                'fill-opacity': 0.3
              }}
            />
            <Layer
              key="radius-circle-stroke-layer"
              id="radius-circle-stroke"
              type="line"
              paint={{
                'line-color': '#ff6b6b',
                'line-width': 2,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* Render markers */}
        {marker && isReporting && (
          <Marker
            key="report-markers"
            longitude={marker.longitude}
            latitude={marker.latitude}
            draggable
            onDragEnd={handleDragEnd}
            onClick={() => console.log(`Clicked marker: ${marker.name}`)}
          />
        )}
        {moderator && unverifiedReports && unverifiedReports.map((report) => (
          <Marker
            key={report._id.$oid}
            longitude={report.location.longitude}
            latitude={report.location.latitude}
            color="red"
            onClick={() => {setCurrentReport(report)
              centerMap(report.location.longitude, report.location.latitude-0.21, 9);
            }}
          />
        ))}

        {
          verifiedReports && verifiedReports.map((report) => (
          <Marker
            key={report._id.$oid}
            longitude={report.location.longitude}
            latitude={report.location.latitude}
            color="orange"
            onClick={() => {setCurrentReport(report)
              centerMap(report.location.longitude, report.location.latitude-0.21, 9);
            }}
          />


          ))

        }


        {
         currentReport && <Popup
            longitude={currentReport ? currentReport.location.longitude : 0}
            latitude={currentReport ? currentReport.location.latitude : 0}
            closeButton={true}
            closeOnClick={false}
            onClose={() => setCurrentReport(null)}
            anchor="top"
            className="reportPopup"
          >
            <ReportPopup currentReport={currentReport} fetchReports={fetchReports} />
          </Popup>
        }
        
        {/* AQI Popup */}
        {selectedAQI && (
          <Popup
            longitude={selectedAQI.geometry.coordinates[0]}
            latitude={selectedAQI.geometry.coordinates[1]}
            closeButton={true}
            closeOnClick={false}
            onClose={() => setSelectedAQI(null)}
            anchor="bottom"
            className="aqi-popup"
          >
            <AQIPopup data={selectedAQI} />
          </Popup>
        )}



      </MapGL>

      {/* Additional controls could go here */}
      {/* <div className="map_controls">
        <h3>FireFlare Map</h3>
      </div> */}
    </div>
  );
};

export default MapComponent;

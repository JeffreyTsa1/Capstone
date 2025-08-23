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
import ModeratorOverlay from "./ModeratorOverlay";
import UserOverlay from "./UserOverlay";
import ReportPopup from "./popups/ReportPopup";

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
  const [reports, setReports] = useState([]);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [marker, setMarker] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  // const [reportMarker, setReportMarkerState] = useState(null);
  // const [userMarker, setUserMarker] = useState(null);
  const [wildfires, setWildfires] = useState(null);
  const [radiusMeters, setRadiusMeters] = useState(1000); // Default radius in meters
  
    // 1) state to hold AQ geojson
  const [aqGeoJSON, setAqGeoJSON] = useState({ type: 'FeatureCollection', features: [] });


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

// 4) kick off on load, and on moveend

const memoizedSetUserMenuOpen = useCallback(setUserMenuOpen, []);
const memoizedUserData = useMemo(() => userData, [userData]);


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
        setReports(data); 
      })
      .catch(error => {
        console.error("Error loading reports data:", error);
      }
    );
  }, []);
  // Check if user exists in database when Auth0 user is loaded
  useEffect(() => {
    const checkUserInDatabase = async () => {
      // Only check if we have a user from Auth0 and haven't checked yet
      if (!user || isLoading || checkingUser || userExistsInDB !== null) return;
      
      setCheckingUser(true);
      console.log("Checking if user exists in database:", user.sub);
      
      try {
        // First check if user exists in Users collection
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/check/${user.sub}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (userResponse.status === 200) {
          const userData = await userResponse.json();
          console.log("User data from Users collection:", userData);
          
          if (userData.exists) {
            setUserExistsInDB(true);
            if (userData.type === 'moderator') {
              setModerator(true);
            }
            setUser(userData.user);
            setUserData(userData.user);
            setShowOnboarding(false);
            return;
          }
        }
        
        // User doesn't exist in either collection - show onboarding
        setUserExistsInDB(false);
        setShowOnboarding(true);
        console.log("User not found in database, showing onboarding");
        
      } catch (error) {
        console.error("Error checking user in database:", error);
        // On error, assume user doesn't exist and show onboarding
        setUserExistsInDB(false);
        setShowOnboarding(true);
      } finally {
        setCheckingUser(false);
      }
    };
    
    checkUserInDatabase();

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

                // console.log("User data:", userData)

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
                      {!marker && <p style={{ fontFamily: 'nexa', color: '#fa7878ff', margin: 0, fontSize: '0.95rem', textAlign: 'center' }}>Please place a marker.</p>}
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

      {/* Onboarding Modal */}
      {showOnboarding && user && (
        <Onboarding 
          user={user}
          setShowOnboarding={setShowOnboarding}
        />
      )}
      {
        moderator && user && !isReporting && (
          <ModeratorOverlay centerMap={centerMap} setCurrentReport={setCurrentReport} />
        )


      }
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


          {aqGeoJSON && (
  <Source id="aq-stations" type="geojson" data={aqGeoJSON}>
    <Layer
      id="aq-markers"
      type="circle"
      paint={{
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 4, 10, 8, 14, 10],
        'circle-color': [
          'step', ['get','aqi'],
          '#ffff00', 100,   // 51–100 Moderate
          '#ff7e00', 150,   // 101–150 USG
          '#ff0000', 200,   // 151–200 Unhealthy
          '#8f3f97', 300,   // 201–300 Very Unhealthy
          '#7e0023'         // 300+ Hazardous
        ],
        'circle-stroke-color': '#000',
        'circle-stroke-width': 0.75,
        'circle-opacity': 0.9
      }}
    />
  </Source>
)}  
        {mapLoaded && (
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
        {moderator && reports && reports.reports.map((report) => (
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
          moderator && currentReport && <Popup
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



      </MapGL>

      {/* Additional controls could go here */}
      {/* <div className="map_controls">
        <h3>FireFlare Map</h3>
      </div> */}
    </div>
  );
};

export default MapComponent;

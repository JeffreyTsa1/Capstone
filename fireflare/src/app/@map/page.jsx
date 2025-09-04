"use client";
import { Suspense, useState, useEffect } from 'react';
import MapComponent from '@/components/MapComponent';
import styles from './page.module.css';
import { motion, AnimatePresence } from 'motion/react';
import { delay } from 'motion';
import { useUser } from "@auth0/nextjs-auth0"
import { useCallback } from 'react';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
const containerVariants = {
    closed: {
        width: '150px',
        height: '50px',
        justifyContent: 'center',
    },
    open: {
        width: '300px',
        height: '400px',
        // maxHeight: '50vh',
        justifyContent: 'flex-start',
        transition: {
            delay: 0.1,
        },
    },
    mobilepreselected: {
        width: '300px',
        height: '100px',
        justifyContent: 'flex-start',
        transition: {
            delay: 0.1,
        },
    },
};


const itemVariants = {
    closed: { opacity: 0, y: 20 },
    open: {
        opacity: 1, y: 0,
        transition: {
            delay: 0.2,
        }
    },
};

// Function to collect device and browser information
const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    
    // Device type detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;
    
    // Operating System detection
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
    
    // Browser detection
    let browser = 'Unknown';
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edg')) browser = 'Edge';
    
    return {
        userAgent,
        deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
        isMobile,
        isTablet,
        isDesktop,
        os,
        browser,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        online: navigator.onLine,
        cookieEnabled: navigator.cookieEnabled,
        platform: navigator.platform,
    };
};

// Function to get IP address (client-side approach)
const getClientIP = async () => {
    try {
        // Using a free IP service - you might want to replace with your own endpoint
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
            const data = await response.json();
            console.log("")
            return data.ip;

        }
    } catch (error) {
        console.warn('Could not fetch IP address:', error);
    }
    return null;
};

// Function to get geolocation if user permits
const getUserLocation = () => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            resolve(null);
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: position.timestamp,
                });
            },
            (error) => {
                console.warn('Geolocation error:', error);
                resolve(null);
            },
            { timeout: 10000, enableHighAccuracy: false }
        );
    });
};

const Page = () => {
    const [isReporting, setIsReporting] = useState(false);
    const [reportMarker, setReportMarker] = useState(null);
    const [isOnline, setIsOnline] = useState(true);
    const [radius, setRadius] = useState(1000); // Default radius in meters
    const [deviceInfo, setDeviceInfo] = useState(null);
    const [userIP, setUserIP] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [isEmergency, setIsEmergency] = useState(true); // true for emergency, false for non-emergency
    
    const isMobile = useIsMobile();

    const { user } = useUser();

    // // Fetch unseen notifications and mark them as seen on page load
    // useEffect(() => {
    //   if (!user?.sub) return;

    //   const fetchUnseenNotifications = async () => {
    //     try {
    //       const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/unseen/${user.sub}`);
    //       const json = await res.json();
    //       if (json.notifications?.length > 0) {
    //         json.notifications.forEach((n) => {
    //           alert(n.message); // or replace with your toast system
    //         });

    //         await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/mark-seen`, {
    //           method: 'PATCH',
    //           headers: { 'Content-Type': 'application/json' },
    //           body: JSON.stringify({ userID: user.sub }),
    //         });
    //       }
    //     } catch (err) {
    //       console.error("Failed to fetch unseen notifications:", err);
    //     }
    //   };

    //   fetchUnseenNotifications();
    // }, [user?.sub]);
    
    const [metadata, setMetadata] = useState({
        userId: user?.sub, // Replace with actual user ID
        location: reportMarker, // Use the marker location
        radiusMeters: radius, // Default radius
        // indicator: e.target.indicator.value, // Get indicator from form 
    });
    const handleSetIsReporting = () => {

        if (user) {
            setIsReporting(!isReporting);
        } else {
            // Store the fact that user was trying to report
            if (typeof window !== 'undefined') {
                localStorage.setItem('redirectAfterLogin', 'report');
                // Redirect to login
                window.location.href = '/auth/login';
            }
        }

    };
    useEffect(() => {
  if (!user?.sub) return;

  const source = new EventSource(`${process.env.NEXT_PUBLIC_API_URL}/notifications/stream?userID=${user.sub}`);

  source.onmessage = (e) => {
    const data = JSON.parse(e.data);
    console.log("🔔 Realtime notification:", data);

    const title = data.title ?? "Notification";
    const body = data.body ?? data.message ?? "New activity";

    alert(`${title}: ${body}`); // Replace with toast system if you want
  };

  source.onerror = (err) => {
    console.error("SSE connection failed:", err);
    source.close();
  };

  return () => source.close();
}, [user?.sub]);
    // Initialize device info and IP on component mount
    useEffect(() => {
        const initializeMetadata = async () => {
            // Get device information
            const deviceData = getDeviceInfo();
            setDeviceInfo(deviceData);
            
            // Get IP address
            const ip = await getClientIP();
            setUserIP(ip);
            
            // Get user's actual location (optional - requires permission)
            const location = await getUserLocation();
            setUserLocation(location);
        };
        
        initializeMetadata();
    }, []);

    useEffect(() => {
        const updateOnline = () => setIsOnline(navigator.onLine)
        window.addEventListener('online', updateOnline)
        window.addEventListener('offline', updateOnline)
        updateOnline()
        return () => {
            window.removeEventListener('online', updateOnline)
            window.removeEventListener('offline', updateOnline)
        }
    }, [])

    const handleSubmit = async (e) => {
        
        if (!reportMarker) {
            alert("Please place a marker on the map to indicate the fire location.");
            return;
        }
        e.preventDefault();
        
        if (isEmergency) {
            const crisisData = {
                userId: user?.sub,
                location: reportMarker,
                radiusMeters: radius,
                type: e.target.indicator.value,
                severity: e.target.severity.value,
                description: e.target.description.value,
                reportedAt: new Date().toISOString(),
                metadata: metadata,
                isEmergency: true,
                title: "Wildfire Report"
                // Add any other relevant data for crisis reports
            };
            
        }

        // Create comprehensive metadata
        const enhancedMetadata = {
            // User info
            userId: user?.sub, // Replace with actual user ID from auth
            sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            
            // Device info
            device: deviceInfo,
            
            // Network info
            ipAddress: userIP,
            isOnline: isOnline,
            
            // Location info
            reportLocation: reportMarker, // Fire location from map
            userLocation: userLocation, // User's actual location (if permitted)
            
            // Timestamp info
            reportedAt: new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            
            // App state
            radiusMeters: reportMarker?.radiusMeters || radius,
        };
        
        const reportData = {
            userId: user?.sub, // Replace with actual user ID
            location: reportMarker, // Use the marker location
            radiusMeters: reportMarker.radiusMeters, // Default radius
            type: isEmergency ? e.target.indicator.value : e.target.concern_type?.value || "other", // Get indicator from form
            severity: isEmergency ? e.target.severity.value : "low",
            description: e.target.description.value,
            reportedAt: new Date().toISOString(), // Use current time
            metadata: enhancedMetadata, // Add the enhanced metadata
            isEmergency: isEmergency, // Whether this is an emergency report or not
        };
        
        console.log("Enhanced report data:", reportData);
        
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/create`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(reportData),
            });
            setIsReporting(false);
        } catch (error) {
            console.error("Error submitting report:", error);
        }
    }

    return (
        <>
            <Suspense fallback={<div className={styles.loading}>Loading map...</div>}>
                <MapComponent
                    isOnline={isOnline}
                    setReportMarker={setReportMarker}
                    onMarkerDrop={setReportMarker}
                    isReporting={isReporting}
                    setIsReporting={setIsReporting}
                    setRadius={setRadius}
                />
            </Suspense>

            <div className={styles.reportWrapper}>
                <motion.div
                    className={styles.reportContainer}
                    variants={containerVariants}
                    whileTap={{ scale: !isReporting ? 0.95 : 1 }}
                    initial="closed"
                    animate={isReporting && isMobile && !reportMarker ? "mobilepreselected" : isReporting ? "open" : "closed"}
                    onClick={() => setIsReporting(true)}
                >
                    <AnimatePresence>
                        {isReporting && <motion.form
                            key={"report-form"}
                            className={styles.reportForm}
                            onSubmit={handleSubmit}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            variants={{ open: { staggerChildren: 0.1 } }}
                        >
                            <motion.button
                                variants={itemVariants}
                                type="button"
                                className={styles.closeButton}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsReporting(false);
                                }}
                            >
                                ✕
                            </motion.button>

                            {isReporting && isMobile && !reportMarker && (<motion.p>
                                Please place a marker on the map
                            </motion.p>)}
                            <motion.h2 variants={itemVariants}>{isEmergency ? "Report a Fire" : "Report a Crisis"}</motion.h2>
                            
                            <motion.div 
                                className={styles.formToggle}
                                variants={itemVariants}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginBottom: '15px',
                                }}
                            >
                                <button 
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEmergency(!isEmergency);
                                    }}
                                    style={{
                                        backgroundColor: isEmergency ? 'rgb(121, 64, 180)' : 'rgb(255, 207, 34)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '20px',
                                        padding: '8px 15px',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    Switch to {isEmergency ? 'Non-Emergency' : 'Emergency'} Report
                                </button>
                            </motion.div>
                            
                            <motion.p className={styles.reportFormField} variants={itemVariants}>Click anywhere on the map to place a marker. Drag the marker on the map to set the location.</motion.p>
                            {isEmergency ? (
                                <>
                                    <motion.div className={styles.reportFormField} variants={itemVariants}>
                                        <label className={styles.reportFormFieldLabel} htmlFor="type">What are you currently experiencing?</label>
                                        <div className={styles.radioGroupRow}>
                                            <div className={styles.radioFieldWrapper}>
                                                <input type="radio" id="typeChoice1" name="indicator" value="smell_smoke" />
                                                <label htmlFor="typeChoice1">I smell smoke</label>
                                            </div>
                                            <div className={styles.radioFieldWrapper}>
                                                <input type="radio" id="typeChoice2" name="indicator" value="visible_smoke" />
                                                <label htmlFor="typeChoice2">I see smoke</label>
                                            </div>
                                            <div className={styles.radioFieldWrapper}>
                                                <input type="radio" id="typeChoice3" name="indicator" value="visible_fire" />
                                                <label htmlFor="typeChoice3">I see fire</label>
                                            </div>
                                        </div>
                                    </motion.div>
                                    <motion.div className={styles.reportFormField} variants={itemVariants}>
                                        <label className={styles.reportFormFieldLabel} htmlFor="severity">How would you rate the severity?</label>
                                        <div className={styles.radioGroupRow}>
                                            <div className={styles.radioFieldWrapper}>
                                                <input type="radio" id="severity-low" name="severity" value="low" defaultChecked />
                                                <label htmlFor="severity-low">Low</label>
                                            </div>
                                            <div className={styles.radioFieldWrapper}>
                                                <input type="radio" id="severity-moderate" name="severity" value="moderate" />
                                                <label htmlFor="severity-moderate">Fair</label>
                                            </div>
                                            <div className={styles.radioFieldWrapper}>
                                                <input type="radio" id="severity-high" name="severity" value="high" />
                                                <label htmlFor="severity-high">High</label>
                                            </div>
                                        </div>
                                    </motion.div>
                                </>
                            ) : (
                                <motion.div className={styles.reportFormField} variants={itemVariants}>
                                    <label className={styles.reportFormFieldLabel} htmlFor="concern_type">Type of Concern</label>
                                    <div className={styles.radioGroupRow}>
                                        <div className={styles.radioFieldWrapper}>
                                            <input type="radio" id="concernType1" name="concern_type" value="flood_risk" />
                                            <label htmlFor="concernType1">Flood Risk</label>
                                        </div>
                                        <div className={styles.radioFieldWrapper}>
                                            <input type="radio" id="concernType2" name="concern_type" value="hazardous_area" />
                                            <label htmlFor="concernType2">Hazard</label>
                                        </div>
                                        <div className={styles.radioFieldWrapper}>
                                            <input type="radio" id="concernType3" name="concern_type" value="other" defaultChecked />
                                            <label htmlFor="concernType3">Other</label>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                            {/* <motion.div className={styles.reportFormField} variants={itemVariants}>
                                    <label htmlFor='contactChoice1'>Please select your preferred contact method:</label>
                                    <div className={styles.radioGroupRow}>
                                        <div className={styles.radioFieldWrapper}>
                                            <input type="radio" id="contactChoice1" name="contact" value="email" />
                                            <label >Smell Smoke</label>
                                        </div>

                                        <div className={styles.radioFieldWrapper}>
                                            <input type="radio" id="contactChoice2" name="contact" value="phone" />
                                            <label >Visible Smoke</label>
                                        </div>

                                        <div className={styles.radioFieldWrapper}>
                                            <input type="radio" id="contactChoice3" name="contact" value="mail" />
                                            <label >Visible Fire</label>
                                        </div>
                                    </div>
                            </motion.div> */}
                            <motion.div className={styles.reportFormField} variants={itemVariants}>
                                <label htmlFor="reportDescription">Description</label>
                                <textarea className={styles.reportDescription} id="reportDescription" name="description" rows="2"></textarea>
                            </motion.div>
                            <motion.div className={styles.buttonGroup} variants={itemVariants}>
                                <button type="submit" style={{
                                    backgroundColor: isEmergency ? 'rgb(255, 207, 34)' : 'rgb(121, 64, 180)',
                                    color: isEmergency ? 'black' : 'white',
                                }} onClick={() => { }}>Submit</button>
                                <button type="button" style={{
                                    backgroundColor: 'white'
                                }} onClick={(e) => {
                                    e.stopPropagation();
                                    setIsReporting(false);
                                }}>Cancel</button>
                            </motion.div>
                        </motion.form>}
                        <motion.span
                            key="report-button"
                            className={styles.reportButtonWrapper}
                            // variants={itemVariants}
                            onClick={() => handleSetIsReporting()}
                            style={{
                                cursor: "pointer",
                                opacity: isReporting ? 0 : 1,
                            }}
                        >
                            {isEmergency ? "Report Fire" : "Report Issue"}
                        </motion.span>
                    </AnimatePresence>
                </motion.div>
            </div>
        </>
    )

}
export default Page;
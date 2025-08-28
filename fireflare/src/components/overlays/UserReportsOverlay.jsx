"use client";
import { motion, AnimatePresence } from "motion/react";
import { useState, memo } from "react";

const UserReportsOverlay = memo(({ centerMap, setCurrentReport, verifiedReports }) => {
    const [activeTab, setActiveTab] = useState("reports");

    // Placeholder data for official incidents
    const officialIncidents = []; // This will be replaced with real data later

    return (
        <div>
            <div className="userReportsOverlay" style={{
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.10)',
                padding: '12px 0 8px 0',
                width: '90vw', // Mobile first - take up most of the viewport width
                maxWidth: '260px', // Cap width at 250px for mobile
                maxHeight: '410px', // Cap height at 250px for mobile
                color: 'white',
                zIndex: 10,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(10px)',
                position: 'fixed',
                bottom: '20px', // Closer to bottom on mobile
                left: '20px',
                // left: '50%', // Center horizontally
                // transform: 'translateX(-50%)', // Center horizontally
                fontFamily: 'proxima-nova, sans-serif',
                overflow: 'hidden', // Ensure content fits within the smaller dimensions
                '@media (minWidth: 768px)': { // Tablet and up
                    width: '400px',
                    maxHeight: '460px',
                    left: '25px',
                    transform: 'none',
                    bottom: '100px'
                }
            }}>
                <h2 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    margin: '0 0 10px 0',
                    textAlign: 'center',
                    color: '#e2e8f0',
                    textTransform: 'uppercase',
                }}>Wildfire Reports</h2>
                
                {/* Tab Navigation */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    margin: '0 12px 10px',
                    paddingBottom: '8px'
                }}>
                    <button 
                        onClick={() => setActiveTab("reports")} 
                        style={{
                            background: 'none',
                            border: 'none',
                            color: activeTab === "reports" ? '#3b82f6' : '#a0a0a0',
                            fontWeight: activeTab === "reports" ? 600 : 400,
                            fontSize: '0.9rem',
                            padding: '5px 10px',
                            borderBottom: activeTab === "reports" ? '2px solid #3b82f6' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Reports
                        {verifiedReports && verifiedReports.length > 0 && (
                            <span style={{
                                background: 'rgb(121 64 180 / 10%)',
                                color: 'white',
                                borderRadius: '50%',
                                padding: '0px 6px',
                                fontSize: '0.75rem',
                                marginLeft: '5px'
                            }}>
                                {verifiedReports.length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => setActiveTab("official")} 
                        style={{
                            background: 'none',
                            border: 'none',
                            color: activeTab === "official" ? '#3b82f6' : '#a0a0a0',
                            fontWeight: activeTab === "official" ? 600 : 400,
                            fontSize: '0.9rem',
                            padding: '5px 10px',
                            borderBottom: activeTab === "official" ? '2px solid #3b82f6' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Official Incidents
                        {officialIncidents && officialIncidents.length > 0 && (
                            <span style={{
                                background: '#f59e0b',
                                color: 'white',
                                borderRadius: '50%',
                                padding: '0px 6px',
                                fontSize: '0.75rem',
                                marginLeft: '5px'
                            }}>
                                {officialIncidents.length}
                            </span>
                        )}
                    </button>
                </div>
                
                <ul style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    maxHeight: 460,
                    overflowY: 'auto',
                }}>
                    {activeTab === "reports" && verifiedReports && verifiedReports.map(report => (
                        <motion.li
                            key={report._id.$oid}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                centerMap(report.location.longitude, report.location.latitude-0.03, 12)
                                setCurrentReport(report)
                            }}
                            style={{
                                background: 'rgb(121 64 180 / 10%)',
                                borderRadius: '10px',
                                margin: '10px 12px',
                                padding: '14px 14px 10px 14px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                                cursor: 'pointer',
                                border: '1px solid rgb(121 64 180 / 10%)',
                                transition: 'background 0.18s',
                            }}
                            whileHover={{ backgroundColor: 'rgb(121 64 180 / 20%)' }}
                        >
                            <div style={{
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>

                                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#fff' }}>
                                    Reported By: 
                                </h3>
                                    <h4 style={{ fontWeight: 400, color: '#cbd5e1' }}>{report.author}</h4>
                                </div>
                                <span style={{
                                    backgroundColor: 'rgb(121 64 180 / 10%)',
                                    borderRadius: '0.25rem',
                                    color: '#fff',
                                    padding: '3px 8px',
                                    fontWeight: 600,
                                    fontSize: '0.75rem'
                                }}>Verified</span>
                            </div>
                            <div className="splitRow" style={{ margin: '8px 0 0 0', gap: 16 }}>
                                <div style={{
                                    textAlign: 'center'
                                }}>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Type</label>
                                    <h5 style={{ marginTop: '5px', fontWeight: 500, color: '#fbbf24' }}>{report.type === "visible_smoke" ? "Visible Smoke" : report.type === "visible_fire" ? "Fire" : report.type === "smell_smoke" ? "Smell of Smoke" : "Unknown"}</h5>
                                </div>
                                <div style={{
                                    textAlign: 'center'
                                }}>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Severity</label>
                                    <h5 style={{ marginTop: '5px' }}>
                                        <span className="severity" style={{
                                            backgroundColor: report.severity === "high" ? "#ff0000" : report.severity === "medium" ? "#ffa500" : "#00ff00",
                                            borderRadius: '0.25rem',
                                            color: '#fff',
                                            padding: '3px 8px',
                                            fontWeight: 600,
                                        }}>{report.severity === "high" ? "High" : report.severity === "medium" ? "Medium" : "Low"}</span>
                                    </h5>
                                </div>
                                                                <div style={{
                                    textAlign: 'center'
                                }}>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Status</label>
                                    <h5 style={{ marginTop: '5px' }}>
                                        <span style={{
                                            backgroundColor: report.moderatorDescription[0]?.fireContained ? "rgb(121 64 180 / 10%)" : "#f59e0b",
                                            borderRadius: '0.25rem',
                                            color: '#fff',
                                            padding: '3px 8px',
                                            fontWeight: 600,
                                            fontSize: '0.75rem'
                                        }}>
                                            {report.moderatorDescription[0]?.fireContained ? "Contained" : "Active"}
                                        </span>
                                    </h5>
                                </div>
                            </div>
                            <div style={{ margin: '10px 0 0 0' }}>
                                <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Description</label>
                                <p style={{ margin: '4px 0 0 0', color: '#e0e0e0', fontSize: '0.97rem', fontWeight: 400 }}>{report.description}</p>
                            </div>
                            <div className="splitRow" style={{ margin: '10px 0 0 0', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Location</label>
                                    <h5 style={{ margin: 0, fontWeight: 500 }}>
                                        {report.location.longitude.toFixed(4)}, {report.location.latitude.toFixed(4)}
                                    </h5>
                                </div>

                            </div>
                            <div style={{ margin: '10px 0 0 0' }}>
                                <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Last Updated</label>
                                <h5 style={{ margin: 0, fontWeight: 400 }}>{new Date(report.moderatorDescription[0]?.lastModeratedAt).toLocaleString()}</h5>
                            </div>
                        </motion.li>
                    ))}
                    
                    {activeTab === "official" && (
                        <div style={{
                            padding: '30px 20px',
                            textAlign: 'center',
                            color: '#a0a0a0',
                        }}>
                            <p style={{ margin: 0 }}>Official incident data coming soon</p>
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>This feature will provide updates from fire departments and emergency services</p>
                        </div>
                    )}
                    
                    {activeTab === "reports" && (!verifiedReports || verifiedReports.length === 0) && (
                        <div style={{
                            padding: '30px 20px',
                            textAlign: 'center',
                            color: '#a0a0a0',
                        }}>
                            <p>No verified reports available</p>
                        </div>
                    )}
                </ul>
            </div>
        </div>
    );
});

export default UserReportsOverlay;

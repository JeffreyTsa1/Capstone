"use client";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, memo } from "react";
// import '';
const ModeratorOverlay = memo(({ centerMap, setCurrentReport, unverifiedReports, verifiedReports }) => {
    const [activeTab, setActiveTab] = useState("all");

    const handleTabClick = (tabName) => {
        // If clicking the already active tab, deselect it and go back to "all"
        if (activeTab === tabName) {
            setActiveTab("all");
        } else {
            setActiveTab(tabName);
        }
    };

    return (
        <div>
            <div className="moderatorOverlay" style={{
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.10)',
                padding: '18px 0 10px 0',
                minWidth: 300,
                maxWidth: 320,
                color: 'white',
                fontFamily: 'proxima-nova, sans-serif',
            }}>
                <h2 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    margin: '0 0 10px 0',
                    textAlign: 'center',
                    color: '#e2e8f0',
                    textTransform: 'uppercase',
                }}>Reports</h2>
                
                {/* Tab Navigation */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    margin: '0 12px 10px',
                    paddingBottom: '8px'
                }}>
                    <button 
                        onClick={() => handleTabClick("unverified")} 
                        style={{
                            background: 'none',
                            border: 'none',
                            color: activeTab === "unverified" ? '#3b82f6' : '#a0a0a0',
                            fontWeight: activeTab === "unverified" ? 600 : 400,
                            fontSize: '0.9rem',
                            padding: '5px 10px',
                            borderBottom: activeTab === "unverified" ? '2px solid #3b82f6' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Unverified
                        {unverifiedReports && unverifiedReports.length > 0 && (
                            <span style={{
                                background: '#3b82f6',
                                color: 'white',
                                borderRadius: '50%',
                                padding: '0px 6px',
                                fontSize: '0.75rem',
                                marginLeft: '5px'
                            }}>
                                {unverifiedReports.length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => handleTabClick("verified")} 
                        style={{
                            background: 'none',
                            border: 'none',
                            color: activeTab === "verified" ? '#3b82f6' : '#a0a0a0',
                            fontWeight: activeTab === "verified" ? 600 : 400,
                            fontSize: '0.9rem',
                            padding: '5px 10px',
                            borderBottom: activeTab === "verified" ? '2px solid #3b82f6' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Verified
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
                </div>
                
                <ul style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    maxHeight: 460,
                    overflowY: 'auto',
                }}>
                    {activeTab === "unverified" && unverifiedReports && unverifiedReports.map(report => (
                        <motion.li
                            key={report._id.$oid}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {centerMap(report.location.longitude, report.location.latitude-0.03, 12)
                            setCurrentReport(report)
                        }}
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '10px',
                                margin: '10px 12px',
                                padding: '14px 14px 10px 14px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                                cursor: 'pointer',
                                border: '1px solid rgba(255,255,255,0.06)',
                                transition: 'background 0.18s',
                            }}
                            whileHover={{ backgroundColor: 'rgba(59,130,246,0.10)' }}
                        >
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#fff' }}>
                                Reported By: <span style={{ fontWeight: 400, color: '#cbd5e1' }}>{report.author}</span>
                            </h3>
                            <div className="splitRow" style={{ margin: '8px 0 0 0', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Type</label>
                                    <h5 style={{ margin: 0, fontWeight: 500, color: '#fbbf24' }}>{report.type === "visible_smoke" ? "Visible Smoke" : report.type === "visible_fire" ? "Fire" : report.type === "smell_smoke" ? "Smell of Smoke" : "Unknown"}</h5>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Severity</label>
                                    <h5 style={{ margin: 0 }}>
                                        <span className="severity" style={{
                                            backgroundColor: report.severity === "high" ? "#ff0000" : report.severity === "medium" ? "#ffa500" : "#00ff00",
                                            borderRadius: '0.25rem',
                                            color: '#fff',
                                            padding: '3px 8px',
                                            fontWeight: 600,
                                        }}>{report.severity == "high" ? "High" : report.severity == "medium" ? "Medium" : "Low"}</span>
                                    </h5>
                                </div>
                            </div>
                            <div style={{ margin: '10px 0 0 0' }}>
                                <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Description</label>
                                <p style={{ margin: '4px 0 0 0', color: '#e0e0e0', fontSize: '0.97rem', fontWeight: 400 }}>{report.description}</p>
                            </div>
                            <div className="splitRow" style={{ margin: '10px 0 0 0', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Longitude</label>
                                    <h5 style={{ margin: 0, fontWeight: 500 }}>{report.location.longitude.toFixed(4)}</h5>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Latitude</label>
                                    <h5 style={{ margin: 0, fontWeight: 500 }}>{report.location.latitude.toFixed(4)}</h5>
                                </div>
                            </div>
                            <div style={{ margin: '10px 0 0 0', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Reported At</label>
                                    <h5 style={{ margin: 0, fontWeight: 400 }}>{new Date(report.reportedAt).toLocaleString()}</h5>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Synced At</label>
                                    <h5 style={{ margin: 0, fontWeight: 400 }}>{new Date(report.syncedAt).toLocaleString()}</h5>
                                </div>
                            </div>
                        </motion.li>
                    ))}
                    
                    {activeTab === "verified" && verifiedReports && verifiedReports.map(report => (
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
                            whileHover={{ backgroundColor: 'rgba(121, 64, 180,0.15)' }}
                        >
                            <div style={{
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#fff' }}>
                                    Reported By: <span style={{ fontWeight: 400, color: '#cbd5e1' }}>{report.author}</span>
                                </h3>
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
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Type</label>
                                    <h5 style={{ margin: 0, fontWeight: 500, color: '#fbbf24' }}>{report.type === "visible_smoke" ? "Visible Smoke" : report.type === "visible_fire" ? "Fire" : report.type === "smell_smoke" ? "Smell of Smoke" : "Unknown"}</h5>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Severity</label>
                                    <h5 style={{ margin: 0 }}>
                                        <span className="severity" style={{
                                            backgroundColor: report.severity === "high" ? "#ff0000" : report.severity === "medium" ? "#ffa500" : "#00ff00",
                                            borderRadius: '0.25rem',
                                            color: '#fff',
                                            padding: '3px 8px',
                                            fontWeight: 600,
                                        }}>{report.severity == "high" ? "High" : report.severity == "medium" ? "Medium" : "Low"}</span>
                                    </h5>
                                </div>
                            </div>
                            <div style={{ margin: '10px 0 0 0' }}>
                                <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Description</label>
                                <p style={{ margin: '4px 0 0 0', color: '#e0e0e0', fontSize: '0.97rem', fontWeight: 400 }}>{report.description}</p>
                            </div>
                            <div className="splitRow" style={{ margin: '10px 0 0 0', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Longitude</label>
                                    <h5 style={{ margin: 0, fontWeight: 500 }}>{report.location.longitude.toFixed(4)}</h5>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Latitude</label>
                                    <h5 style={{ margin: 0, fontWeight: 500 }}>{report.location.latitude.toFixed(4)}</h5>
                                </div>
                            </div>
                            <div style={{ margin: '10px 0 0 0', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Reported At</label>
                                    <h5 style={{ margin: 0, fontWeight: 400 }}>{new Date(report.reportedAt).toLocaleString()}</h5>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Verified At</label>
                                    <h5 style={{ margin: 0, fontWeight: 400 }}>{report.verifiedAt ? new Date(report.verifiedAt).toLocaleString() : 'N/A'}</h5>
                                </div>
                            </div>
                        </motion.li>
                    ))}
                    
                    {(activeTab !== "unverified" && activeTab !== "verified") && [...(verifiedReports || []), ...(unverifiedReports || [])].map(report => (
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
                                background: report.isVerified ? 'rgb(121 64 180 / 10%)' : 'rgba(255,255,255,0.03)',
                                borderRadius: '10px',
                                margin: '10px 12px',
                                padding: '14px 14px 10px 14px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                                cursor: 'pointer',
                                border: report.isVerified ? '1px solid rgb(121 64 180 / 10%)' : '1px solid rgba(255,255,255,0.06)',
                                transition: 'background 0.18s',
                            }}
                            whileHover={{ backgroundColor: report.isVerified ? 'rgb(121 64 180 / 15%)' : 'rgba(59,130,246,0.10)' }}
                        >
                            <div style={{
                                display: 'flex', 
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#fff' }}>
                                    Reported By: <span style={{ fontWeight: 400, color: '#cbd5e1' }}>{report.author}</span>
                                </h3>
                                {report.isVerified && (
                                    <span style={{
                                        backgroundColor: 'rgb(121 64 180 / 10%)',
                                        borderRadius: '0.25rem',
                                        color: '#fff',
                                        padding: '3px 8px',
                                        fontWeight: 600,
                                        fontSize: '0.75rem'
                                    }}>Verified</span>
                                )}
                            </div>
                            <div className="splitRow" style={{ margin: '8px 0 0 0', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Type</label>
                                    <h5 style={{ margin: 0, fontWeight: 500, color: '#fbbf24' }}>{report.type === "visible_smoke" ? "Visible Smoke" : report.type === "visible_fire" ? "Fire" : report.type === "smell_smoke" ? "Smell of Smoke" : "Unknown"}</h5>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Severity</label>
                                    <h5 style={{ margin: 0 }}>
                                        <span className="severity" style={{
                                            backgroundColor: report.severity === "high" ? "#ff0000" : report.severity === "medium" ? "#ffa500" : "#00ff00",
                                            borderRadius: '0.25rem',
                                            color: '#fff',
                                            padding: '3px 8px',
                                            fontWeight: 600,
                                        }}>{report.severity == "high" ? "High" : report.severity == "medium" ? "Medium" : "Low"}</span>
                                    </h5>
                                </div>
                            </div>
                            <div style={{ margin: '10px 0 0 0' }}>
                                <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Description</label>
                                <p style={{ margin: '4px 0 0 0', color: '#e0e0e0', fontSize: '0.97rem', fontWeight: 400 }}>{report.description}</p>
                            </div>
                            <div className="splitRow" style={{ margin: '10px 0 0 0', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Longitude</label>
                                    <h5 style={{ margin: 0, fontWeight: 500 }}>{report.location.longitude.toFixed(4)}</h5>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Latitude</label>
                                    <h5 style={{ margin: 0, fontWeight: 500 }}>{report.location.latitude.toFixed(4)}</h5>
                                </div>
                            </div>
                            <div style={{ margin: '10px 0 0 0', gap: 16 }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>Reported At</label>
                                    <h5 style={{ margin: 0, fontWeight: 400 }}>{new Date(report.reportedAt).toLocaleString()}</h5>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', color: '#b3b3b3' }}>
                                        {report.isVerified ? 'Verified At' : 'Synced At'}
                                    </label>
                                    <h5 style={{ margin: 0, fontWeight: 400 }}>
                                        {report.isVerified && report.verifiedAt ? 
                                            new Date(report.verifiedAt).toLocaleString() : 
                                            new Date(report.syncedAt).toLocaleString()}
                                    </h5>
                                </div>
                            </div>
                        </motion.li>
                    ))}
                    
                    {/* Show a message when there are no reports in the current tab */}
                    {((activeTab === "unverified" && (!unverifiedReports || unverifiedReports.length === 0)) ||
                      (activeTab === "verified" && (!verifiedReports || verifiedReports.length === 0)) ||
                      (activeTab !== "unverified" && activeTab !== "verified" && (!unverifiedReports || unverifiedReports.length === 0) && (!verifiedReports || verifiedReports.length === 0))) && (
                        <div style={{
                            padding: '30px 20px',
                            textAlign: 'center',
                            color: '#a0a0a0',
                        }}>
                            <p>No reports available</p>
                        </div>
                    )}
                </ul>
            </div>
        </div>
    );
});

export default ModeratorOverlay;
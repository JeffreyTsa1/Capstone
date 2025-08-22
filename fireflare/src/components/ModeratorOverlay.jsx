"use client";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, memo } from "react";
import './components.css';
const ModeratorOverlay = memo(({ centerMap, setCurrentReport }) => {
    const [reports, setReports] = useState([]);

    useEffect(() => {
        // Any setup if needed

        try {
            const fetchReports = async () => {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/all`);
                const data = await response.json();
                console.log("Fetched reports:", data);
                setReports(data.reports);
                // Handle the fetched data (e.g., set state)
            };

            fetchReports();
        } catch (error) {
            console.error("Error fetching reports:", error);
        }
    }, []);

    return (
        <div>
            <div className="moderatorOverlay" style={{
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
                border: '1px solid rgba(255,255,255,0.10)',
                padding: '18px 0 10px 0',
                minWidth: 300,
                maxWidth: 340,
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
                <ul style={{
                    listStyle: 'none',
                    margin: 0,
                    padding: 0,
                    maxHeight: 460,
                    // overflowY: 'auto',
                }}>
                    {reports && reports.map(report => (
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
                </ul>
            </div>
        </div>
    );
});

export default ModeratorOverlay;
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
            <div className="moderatorOverlay">
                <h2>Reports</h2>
                <ul>
                    {reports && reports.map(report => (
                        <motion.li
                            key={report._id.$oid}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {centerMap(report.location.longitude, report.location.latitude, 12)
                            setCurrentReport(report)
                        }}
                        >
                            {/* <pre>
                                {report.id}
                            </pre> */}
                            <h3>
                                Reported By: <span>{report.author}</span>
                            </h3>
                            <h3>
                                Reported At: <span>{new Date(report.reportedAt).toLocaleString()}</span>
                            </h3>
                            <h3>
                                Synced At: <span>{new Date(report.syncedAt).toLocaleString()}</span>
                            </h3>
                            <p>
                            {report.description}
                            </p>
                            
                            <div className="splitRow">
                                <div>

                                <label>
                                    Longitude
                                </label>
                                <h5>
                                    {report.location.longitude.toFixed(4)}
                                </h5>
                                
                            </div>
                            <div>
                                <label>
                                    Latitude
                                </label>
                                <h5>
                                    {report.location.latitude.toFixed(4)}
                                </h5>
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
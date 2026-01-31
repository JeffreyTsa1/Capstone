"use client";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState, memo } from "react";
import styles from './ModeratorOverlay.module.css';
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
            <div className={styles.moderatorOverlay}>
                <h2 className={styles.title}>Reports</h2>
                
                {/* Tab Navigation */}
                <div className={styles.tabNavigation}>
                    <button 
                        onClick={() => handleTabClick("unverified")} 
                        className={`${styles.tabButton} ${activeTab === "unverified" ? styles.tabButtonActive : ''}`}
                    >
                        Unverified
                        {unverifiedReports && unverifiedReports.length > 0 && (
                            <span className={styles.tabBadge}>
                                {unverifiedReports.length}
                            </span>
                        )}
                    </button>
                    <button 
                        onClick={() => handleTabClick("verified")} 
                        className={`${styles.tabButton} ${activeTab === "verified" ? styles.tabButtonActive : ''}`}
                    >
                        Verified
                        {verifiedReports && verifiedReports.length > 0 && (
                            <span className={`${styles.tabBadge} ${styles.tabBadgeVerified}`}>
                                {verifiedReports.length}
                            </span>
                        )}
                    </button>
                </div>
                
                <ul className={styles.reportsList}>
                    {activeTab === "unverified" && unverifiedReports && unverifiedReports.map(report => (
                        <motion.li
                            key={report._id.$oid}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {centerMap(report.location.longitude, report.location.latitude-0.03, 12)
                            setCurrentReport(report)
                        }}
                            className={styles.reportItem}
                            whileHover={{ backgroundColor: 'rgba(59,130,246,0.10)' }}
                        >
                            <h3 className={styles.reportAuthor}>
                                Reported By: <span className={styles.reportAuthorName}>{report.author}</span>
                            </h3>
                            <div className={styles.splitRow}>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Type</label>
                                    <h5 className={`${styles.fieldValue} ${styles.fieldValueType}`}>{report.type === "visible_smoke" ? "Visible Smoke" : report.type === "visible_fire" ? "Fire" : report.type === "smell_smoke" ? "Smell of Smoke" : "Unknown"}</h5>
                                </div>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Severity</label>
                                    <h5 className={styles.fieldValue}>
                                        <span className={`${styles.severityBadge} ${
                                            report.severity === "high" ? styles.severityHigh : 
                                            report.severity === "medium" ? styles.severityMedium : 
                                            styles.severityLow
                                        }`}>{report.severity == "high" ? "High" : report.severity == "medium" ? "Medium" : "Low"}</span>
                                    </h5>
                                </div>
                            </div>
                            <div className={styles.descriptionSection}>
                                <label className={styles.fieldLabel}>Description</label>
                                <p className={styles.description}>{report.description}</p>
                            </div>
                            <div className={styles.splitRow}>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Longitude</label>
                                    <h5 className={styles.fieldValue}>{report.location.longitude.toFixed(4)}</h5>
                                </div>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Latitude</label>
                                    <h5 className={styles.fieldValue}>{report.location.latitude.toFixed(4)}</h5>
                                </div>
                            </div>
                            <div className={styles.timestampSection}>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Reported At</label>
                                    <h5 className={`${styles.fieldValue} ${styles.timestampValue}`}>{new Date(report.reportedAt).toLocaleString()}</h5>
                                </div>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Synced At</label>
                                    <h5 className={`${styles.fieldValue} ${styles.timestampValue}`}>{new Date(report.syncedAt).toLocaleString()}</h5>
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
                            className={`${styles.reportItem} ${styles.reportItemVerified}`}
                            whileHover={{ backgroundColor: 'rgba(121, 64, 180,0.15)' }}
                        >
                            <div className={styles.reportHeader}>
                                <h3 className={styles.reportAuthor}>
                                    Reported By: <span className={styles.reportAuthorName}>{report.author}</span>
                                </h3>
                                <span className={styles.verifiedBadge}>Verified</span>
                            </div>
                            <div className={styles.splitRow}>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Type</label>
                                    <h5 className={`${styles.fieldValue} ${styles.fieldValueType}`}>{report.type === "visible_smoke" ? "Visible Smoke" : report.type === "visible_fire" ? "Fire" : report.type === "smell_smoke" ? "Smell of Smoke" : "Unknown"}</h5>
                                </div>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Severity</label>
                                    <h5 className={styles.fieldValue}>
                                        <span className={`${styles.severityBadge} ${
                                            report.severity === "high" ? styles.severityHigh : 
                                            report.severity === "medium" ? styles.severityMedium : 
                                            styles.severityLow
                                        }`}>{report.severity == "high" ? "High" : report.severity == "medium" ? "Medium" : "Low"}</span>
                                    </h5>
                                </div>
                            </div>
                            <div className={styles.descriptionSection}>
                                <label className={styles.fieldLabel}>Description</label>
                                <p className={styles.description}>{report.description}</p>
                            </div>
                            <div className={styles.splitRow}>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Longitude</label>
                                    <h5 className={styles.fieldValue}>{report.location.longitude.toFixed(4)}</h5>
                                </div>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Latitude</label>
                                    <h5 className={styles.fieldValue}>{report.location.latitude.toFixed(4)}</h5>
                                </div>
                            </div>
                            <div className={styles.timestampSection}>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Reported At</label>
                                    <h5 className={`${styles.fieldValue} ${styles.timestampValue}`}>{new Date(report.reportedAt).toLocaleString()}</h5>
                                </div>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Verified At</label>
                                    <h5 className={`${styles.fieldValue} ${styles.timestampValue}`}>{report.verifiedAt ? new Date(report.verifiedAt).toLocaleString() : 'N/A'}</h5>
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
                            className={`${styles.reportItem} ${report.isVerified ? styles.reportItemVerified : ''}`}
                            whileHover={{ backgroundColor: report.isVerified ? 'rgb(121 64 180 / 15%)' : 'rgba(59,130,246,0.10)' }}
                        >
                            <div className={styles.reportHeader}>
                                <h3 className={styles.reportAuthor}>
                                    Reported By: <span className={styles.reportAuthorName}>{report.author}</span>
                                </h3>
                                {report.isVerified && (
                                    <span className={styles.verifiedBadge}>Verified</span>
                                )}
                            </div>
                            <div className={styles.splitRow}>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Type</label>
                                    <h5 className={`${styles.fieldValue} ${styles.fieldValueType}`}>{report.type === "visible_smoke" ? "Visible Smoke" : report.type === "visible_fire" ? "Fire" : report.type === "smell_smoke" ? "Smell of Smoke" : "Unknown"}</h5>
                                </div>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Severity</label>
                                    <h5 className={styles.fieldValue}>
                                        <span className={`${styles.severityBadge} ${
                                            report.severity === "high" ? styles.severityHigh : 
                                            report.severity === "medium" ? styles.severityMedium : 
                                            styles.severityLow
                                        }`}>{report.severity == "high" ? "High" : report.severity == "medium" ? "Medium" : "Low"}</span>
                                    </h5>
                                </div>
                            </div>
                            <div className={styles.descriptionSection}>
                                <label className={styles.fieldLabel}>Description</label>
                                <p className={styles.description}>{report.description}</p>
                            </div>
                            <div className={styles.splitRow}>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Longitude</label>
                                    <h5 className={styles.fieldValue}>{report.location.longitude.toFixed(4)}</h5>
                                </div>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Latitude</label>
                                    <h5 className={styles.fieldValue}>{report.location.latitude.toFixed(4)}</h5>
                                </div>
                            </div>
                            <div className={styles.timestampSection}>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>Reported At</label>
                                    <h5 className={`${styles.fieldValue} ${styles.timestampValue}`}>{new Date(report.reportedAt).toLocaleString()}</h5>
                                </div>
                                <div className={styles.splitRowItem}>
                                    <label className={styles.fieldLabel}>
                                        {report.isVerified ? 'Verified At' : 'Synced At'}
                                    </label>
                                    <h5 className={`${styles.fieldValue} ${styles.timestampValue}`}>
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
                        <div className={styles.emptyState}>
                            <p>No reports available</p>
                        </div>
                    )}
                </ul>
            </div>
        </div>
    );
});

export default ModeratorOverlay;
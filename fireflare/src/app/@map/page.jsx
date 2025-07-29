"use client";
import { Suspense, useState, useEffect } from 'react';
import MapComponent from '@/components/MapComponent';
import styles from './page.module.css';
import { motion, AnimatePresence } from 'motion/react';
import { delay } from 'motion';

const containerVariants = {
  closed: {
    width: '150px',
    height: '50px',
    justifyContent: 'center',
  },
  open: {
    width: '300px',
    height: '450px',
    // maxHeight: '50vh',
    justifyContent: 'flex-start',
    transition: {
        delay: 0.1,
    },
  },
};

const itemVariants = {
  closed: { opacity: 0, y: 20 },
  open: { opacity: 1, y: 0,
    transition: {
        delay: 0.2,
    }
   },
};

const Page = () => {
    const [isReporting, setIsReporting] = useState(false);
    const [reportMarker, setReportMarker] = useState(null);
    const [isOnline, setIsOnline] = useState(true);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted");
    // Add form submission logic here
    setIsReporting(false); // Close form on submit
  }

  return (
    <>
        <Suspense fallback={<div className={styles.loading}>Loading map...</div>}>
        <MapComponent 
          isOnline={isOnline}
          setReportMarker={setReportMarker}
          onMarkerDrop={setReportMarker}
          isReporting={isReporting}
        />
        </Suspense>

        <div className={styles.reportWrapper}>
            <motion.div 
                className={styles.reportContainer}
                variants={containerVariants}
                initial="closed"
                animate={isReporting ? "open" : "closed"}
                onClick={() => !isReporting && setIsReporting(true)}
            >
                <AnimatePresence>
                        {isReporting && <motion.form 
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
                                onClick={(e) => {e.stopPropagation()
                                    setIsReporting(false);
                                }}
                            >
                                ✕
                            </motion.button>   

                            <motion.h2 variants={itemVariants}>Report a Fire</motion.h2>
                            <motion.p className={styles.reportFormField} variants={itemVariants}>Click anywhere on the map to place a marker. Drag the marker on the map to set the fire location.</motion.p>
                            <motion.div className={styles.reportFormField} variants={itemVariants}>
                                <label htmlFor="severity">Severity</label>
                                <select className={styles.reportDropdown} id="severity" name="severity">
                                    <option value="low">Low</option>
                                    <option value="moderate">Moderate</option>
                                    <option value="high">High</option>
                                    <option value="extreme">Extreme</option>
                                </select>
                            </motion.div>
                            <motion.div className={styles.reportFormField} variants={itemVariants}>
                                <label htmlFor="reportDescription">Description</label>
                                <textarea className={styles.reportDescription} id="reportDescription" name="description" rows="2"></textarea>
                            </motion.div>
                            <motion.div className={styles.buttonGroup} variants={itemVariants}>
                                <button type="submit" style={{
                                    backgroundColor: 'rgb(255, 207, 34)',
                                }} onClick={() => {}}>Submit</button>
                                <button type="button" style={{
                                    backgroundColor: 'white'
                                }} onClick={(e) => {
                                    e.stopPropagation();
                                    setIsReporting(false);
                                }}>Cancel</button>
                            </motion.div>
                        </motion.form>}
                        <motion.span
                        className={styles.reportButtonWrapper}
                        // variants={itemVariants}
                        style={{
                            cursor: "pointer",
                            opacity: isReporting ? 0 : 1,
                        }}
                        >
                            Report Fire
                        </motion.span>
                </AnimatePresence>
            </motion.div>
        </div>
    </>
 )
}

export default Page;
"use client";

import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { memo } from "react";

const userMenuVariants = {
  closed: {
    width: '180px',
    height: '90px',
    justifyContent: 'center',
  },
  open: {
    width: '260px',
    height: '390px', // Increased height to accommodate legend options
    justifyContent: 'flex-start',
    transition: {
      delay: 0.1,
    },
  },
};

const UserOverlay = memo(({
  userMenuOpen,
  setUserMenuOpen,
  moderator,
  userData,
  showAQI,
  setShowAQI,
  showWildfire,
  setShowWildfire,
  showAQILayer,
  setShowAQILayer,
  showWildfireLayer,
  setShowWildfireLayer,
  showReportsOverlay,
  setShowReportsOverlay
}) => {
  return (
    <motion.div
      className="userOverlay"
      initial="closed"
      whileTap={{ scale: 0.95 }}
      animate={userMenuOpen ? "open" : "closed"}
      onClick={() => setUserMenuOpen(!userMenuOpen)}
      variants={userMenuVariants}
    >
      <h2>{moderator ? "Moderator " : "User"}</h2>
      <p>{userData && `${userData.firstName} ${userData.lastName}`}</p>
      {userMenuOpen && (
        <AnimatePresence>
          <motion.div
            className="userOverlayMenu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ul>
              <li className="legend-option">
                <div className="legend-toggles">
                  <div className="toggleWrapper">
                    <div 
                      className={`option ${showReportsOverlay ? 'option-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowReportsOverlay(!showReportsOverlay);
                      }}
                    >
                      <div className={`toggle-indicator ${showReportsOverlay ? 'active' : ''}`}>
                        <span className="toggle-dot"></span>
                      </div>
                      <span className="option-label">Show Reports</span>
                    </div>
                  </div>
                </div>
              </li>
              <li>
                <Link onClick={(e) => e.stopPropagation()} href="/settings">Settings</Link>
              </li>

              {/* Legend Toggle Options */}
              <li className="legend-option">
                <div className="legend-toggles">
                  <span className="legend-header">Map Legend</span>
                  <div className="toggleWrapper">

                    <div 
                      className={`option ${showAQI ? 'option-active' : ''}`} 
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAQI(!showAQI);
                      }}
                    >
                      <div className={`toggle-indicator ${showAQI ? 'active' : ''}`}>
                        <span className="toggle-dot"></span>
                      </div>
                      <span className="option-label">Air Quality</span>
                    </div>
                    <div 
                      className={`option ${showWildfire ? 'option-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowWildfire(!showWildfire);
                      }}
                    >
                      <div className={`toggle-indicator ${showWildfire ? 'active' : ''}`}>
                        <span className="toggle-dot"></span>
                      </div>
                      <span className="option-label">Wildfires</span>
                    </div>
                  </div>
                  <span className="legend-header">Map Layers</span>
                  <div className="toggleWrapper">
                    <div 
                      className={`option ${showWildfireLayer ? 'option-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowWildfireLayer(!showWildfireLayer);
                      }}
                    >
                      <div className={`toggle-indicator ${showWildfireLayer ? 'active' : ''}`}>
                        <span className="toggle-dot"></span>
                      </div>
                      <span className="option-label">NASA Satellite</span>
                    </div>

                    <div 
                      className={`option ${showAQILayer ? 'option-active' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAQILayer(!showAQILayer);
                      }}
                    >
                      <div className={`toggle-indicator ${showAQILayer ? 'active' : ''}`}>
                        <span className="toggle-dot"></span>
                      </div>
                      <span className="option-label">AQI</span>
                    </div>
                  </div>
                </div>

              </li>

              <li>
                <Link onClick={(e) => e.stopPropagation()} href="/auth/logout" className="logout-link">
                  Logout
                </Link>
              </li>
            </ul>
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
});

export default UserOverlay;

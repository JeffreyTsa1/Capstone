"use client";

import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { memo } from "react";

  const userMenuVariants = {
    closed: {
        width: 'unset',
        height: 'unset',
        justifyContent: 'center',
    },
    open: {
        width: '200px',
        height: '220px',
        // maxHeight: '50vh',
        justifyContent: 'flex-start',
        // transition: {
        //     delay: 0.1,
        // },
    },
};

const UserOverlay = memo(({ userMenuOpen, setUserMenuOpen, moderator, userData }) => {
  
  
    return (
    <motion.div
      className="userOverlay"
      initial="closed"
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
              <li>
                <Link onClick={(e) => e.stopPropagation()} href="/reports">Reports</Link>
              </li>
              <li>
                <Link onClick={(e) => e.stopPropagation()} href="/settings">Settings</Link>
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

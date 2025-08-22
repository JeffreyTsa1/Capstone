"use client"
import './components.css'
import { motion } from 'motion/react';

export const PopupNav = () => {
  return (
    <div className="popupNav"
    >
        <button>
            User

        </button>
        <div>
            <h2>
                Test
            </h2>
            <button>
                Settings
            </button>
            <button>
                All Reports
            </button>
            <button>
                Logout
            </button>
        </div>  
    </div>
  )
}

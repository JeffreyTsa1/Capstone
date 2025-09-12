"use client";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import "./WelcomeModal.css";

const WelcomeModal = ({ isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: "Welcome to Fireflare",
            content: "Your community-driven wildfire monitoring and crisis reporting platform",
            image: "",
            description: "Fireflare is a community-driven wildfire and emergency map. Report incidents in real time and see verified reports near you. Stay informed about environmental hazards in your area with real-time community-driven data."
        },
        {
            title: "Real-Time Wildfire Data",
            content: "Monitor active wildfires with NASA satellite data",
            image: "/fire-icon.svg", // You'll need to add this
            description: "Get up-to-date information about wildfire locations, intensity, and air quality conditions powered by NASA's satellite monitoring systems."
        },
        {
            title: "Community Reporting",
            content: "Report incidents and help keep your community safe",
            image: "/community-icon.svg", // You'll need to add this
            description: "Quickly report fires, smoke, or other emergencies to help authorities and neighbors stay informed about local conditions."
        },
        {
            title: "Stay Connected",
            content: "Get notifications and updates that matter to you",
            image: "/notification-icon.svg", // You'll need to add this
            description: "Receive alerts about nearby incidents, air quality changes, and important safety information for your area."
        }
    ];

    const nextSlide = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    };

    const prevSlide = () => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    };

    const goToSlide = (index) => {
        setCurrentSlide(index);
    };

    const handleGetStarted = () => {
        // Mark welcome as seen
        localStorage.setItem('fireflareWelcomeSeen', 'true');
        onClose();
    };

    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.8,
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 300
            }
        },
        exit: {
            opacity: 0,
            scale: 0.8,
            transition: {
                duration: 0.2
            }
        }
    };

    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 300
            }
        },
        exit: (direction) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 300
            }
        })
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="welcome-modal-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div 
                        className="welcome-modal"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button 
                            className="welcome-modal-close"
                            onClick={onClose}
                            aria-label="Close welcome modal"
                        >
                            ✕
                        </button>

                        {/* Slide container */}
                        <div className="welcome-slide-container">
                            <AnimatePresence mode="wait" custom={currentSlide}>
                                <motion.div
                                    key={currentSlide}
                                    custom={currentSlide}
                                    variants={slideVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    className="welcome-slide"
                                >
                                    {/* Slide image */}
                                        {
                                            slides[currentSlide].image === "" ? (
                                                <></>
                                            ) : (
                                    <div className="welcome-slide-image">

                                                <img 
                                                    src={slides[currentSlide].image} 
                                                    alt={slides[currentSlide].title}
                                            onError={(e) => {
                                                // Fallback to favicon if image doesn't exist
                                                e.target.src = "/fireflare_logo(favicon).png";
                                            }}
                                        />
                                    </div>
                                            )}


                                    {/* Slide content */}
                                    <div className="welcome-slide-content">
                                        <h2>{slides[currentSlide].title}</h2>
                                        <h3>{slides[currentSlide].content}</h3>
                                        <p>{slides[currentSlide].description}</p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Progress indicators */}
                        <div className="welcome-progress">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    className={`welcome-progress-dot ${index === currentSlide ? 'active' : ''}`}
                                    onClick={() => goToSlide(index)}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="welcome-navigation">
                            <button 
                                className="welcome-nav-button prev"
                                onClick={prevSlide}
                                disabled={currentSlide === 0}
                                style={{ opacity: currentSlide === 0 ? 0.3 : 1 }}
                            >
                                ← Previous
                            </button>
                            
                            {currentSlide === slides.length - 1 ? (
                                <button 
                                    className="welcome-nav-button get-started"
                                    onClick={handleGetStarted}
                                >
                                    Get Started 🔥
                                </button>
                            ) : (
                                <button 
                                    className="welcome-nav-button next"
                                    onClick={nextSlide}
                                >
                                    Next →
                                </button>
                            )}
                        </div>

                        {/* Skip option */}
                        <button 
                            className="welcome-skip"
                            onClick={handleGetStarted}
                        >
                            Skip tutorial
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeModal;

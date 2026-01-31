"use client";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import "./WelcomeModal.css";

const WelcomeModal = ({ isOpen, onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            title: "Welcome to Fireflare",
            content: "Your community-driven wildfire monitoring platform",
            image: "/ff.png",
            description: "Sign up to report wildfire incidents and see verified reports near you. Stay informed about hazards in your area with real-time community-driven data."
        },
        {
            title: "Cross-Verification Layers",
            content: "",
            image: "/fire-icon.svg", // You'll need to add this
            description: "We layer real-time data from NASA's satellites (FIRMS), cross-referenced with air quality (AQI) data points, and community reports onto a map so users can visualize the impact of wildfires. Check the legend overlays to learn more."
        },
        {
            title: "Community Reporting",
            content: "",
            image: "/community-icon.svg", // You'll need to add this
            description: "Quickly report fires, smoke, or other emergencies. You can report a crisis event that you're experiencing and request help from others in your community."
        },
        {
            title: "Stay Connected",
            content: "",
            image: "/notification-icon.svg", // You'll need to add this
            description: "After you register and add the addresses you want to monitor, receive alerts about nearby incidents, air quality changes, and important safety information for your area(s)."
        },
        {
            title: "Customize Your Experience",
            content: "Tailor the app to your needs",
            image: "", // You'll need to add this
            description: "Adjust settings, notifications, and map layers in the user menu on the top left corner to create a personalized experience."
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
                scale: 0.95,
            },
            visible: {
                opacity: 1,
                scale: 1,
                transition: {
                    duration: 0.45,
                    ease: "easeOut"
                }
            },
            exit: {
                opacity: 0,
                scale: 0.95,
                transition: {
                    duration: 0.3,
                    ease: "easeIn"
                }
            }
    };

    const slideVariants = {
            enter: (direction) => ({
                x: direction > 0 ? 120 : -120,
                opacity: 0,
                transition: {
                    duration: 0.35,
                    ease: "easeOut"
                }
            }),
            center: {
                x: 0,
                opacity: 1,
                transition: {
                    duration: 0.45,
                    ease: "easeOut"
                }
            },
            exit: (direction) => ({
                x: direction < 0 ? 120 : -120,
                opacity: 0,
                transition: {
                    duration: 0.35,
                    ease: "easeIn"
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
                                    Get Started
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
                        <div className="welcome-skip-wrapper">
                            <button 
                                className="welcome-skip"
                                onClick={handleGetStarted}
                            >
                                Skip tutorial
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WelcomeModal;

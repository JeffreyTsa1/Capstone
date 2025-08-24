"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '@auth0/nextjs-auth0';
import './reportPopup.css';
const moderatorWindowStrings = {
    "approve": {"Title": "Approve Report",
        "description": "Please provide a description for the approval.",
        "buttonText": "Yes, Approve",
        "inputPlaceholder": "Enter approval notes here...",
        "submissionWarning": "Are you sure you want to approve this report? This action cannot be undone.",
        "buttonColor": "#4CAF50", // Green for approval
        "buttonTextColor": "#fff", // White text for contrast

    },
    "reject": {"Title": "Reject Report",
        "description": "Please provide a description for the rejection.",
        "buttonText": "Yes, Reject",
        "inputPlaceholder": "Enter rejection notes here...",
        "submissionWarning": "Are you sure you want to reject this report? This action cannot be undone."
    },
    "escalate": {"Title": "Escalate Report",
        "description": "Please provide a description for the escalation.",
        "buttonText": "Yes, Escalate",
        "inputPlaceholder": "Enter escalation notes here...",
        "submissionWarning": "Are you sure you want to escalate this report? This action cannot be undone."
    }
}


const ReportPopup = ({currentReport, onClose}) => {
    const { user } = useUser();
    const [moderatorPanel, setModeratorPanel] = useState(null);
    
    // Check if user has moderator privileges - can be adjusted based on your auth model
    const canModerate = user && user.moderatorRole; // Or any other logic to determine moderator status
    
    console.log("Current Report in Popup:", currentReport);
    // Function to close the report popup
    const closeReport = () => {
        if (typeof onClose === 'function') {
            onClose();
        }
    };
    
    // Function to close the moderator form panel
    const closeModeratorForm = () => {
        setModeratorPanel(null);
    };
    
    const handleModeratorPanel = (buttonText) => {
        if (moderatorPanel === buttonText) {
            setModeratorPanel(null);
        } 
        else {
            setModeratorPanel(buttonText);
        }
    }
    // if (currentReport.moderatorDescription.length === 0) {
    //     return null; // or handle it in a way that makes sense for your application
    // }
    // Helper function to get common form data
    const getModeratorFormData = () => {
        const fireContainedRadios = document.getElementsByName("fireContained");
        const fireContained = Array.from(fireContainedRadios).find(radio => radio.checked)?.value === "yes";
        
        return {
            userID: user.sub,
            reportID: currentReport?._id?.$oid,
            moderatorDescription: document.getElementById("moderatorDescription").value,
            moderatorBackground: document.getElementById("moderatorBackground").value,
            fireContained: fireContained,
            moderatorName: user?.name || user?.email || "Unknown Moderator"
        };
    };
    
    // Display toast message instead of alert
    const showToast = (message, isError = false) => {
        // You can replace this with a proper toast notification system if available
        const toastStyle = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${isError ? '#F44336' : '#4CAF50'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        const toast = document.createElement('div');
        toast.innerText = message;
        toast.style = toastStyle;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    };

    const submitApproval = () => {
        // API call to backend to approve report
        console.log("Submitting approval for report:", currentReport);
        
        const body = {
            ...getModeratorFormData(),
            action: "approve"
        };
        
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        }).then(response => {
            if (response.ok) {
                showToast("Report approved successfully");
                setModeratorPanel(null);
                // Reload the page or update the report list
                window.location.reload();
            } else {
                showToast("Failed to approve report", true);
            }
        }).catch(error => {
            console.error("Error approving report:", error);
            showToast("An error occurred while approving the report", true);
        });
    }
    
    const submitRejection = () => {
        // API call to backend to reject report
        const body = {
            ...getModeratorFormData(),
            action: "reject"
        };
        
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        }).then(response => {
            if (response.ok) {
                showToast("Report rejected successfully");
                setModeratorPanel(null);
                // Reload the page or update the report list
                window.location.reload();
            } else {
                showToast("Failed to reject report", true);
            }
        }).catch(error => {
            console.error("Error rejecting report:", error);
            showToast("An error occurred while rejecting the report", true);
        });
    }

    const submitEscalation = () => {
        // API call to backend to escalate report
        const body = {
            ...getModeratorFormData(),
            action: "escalate"
        };
        
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/escalate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        }).then(response => {
            if (response.ok) {
                showToast("Report escalated successfully");
                setModeratorPanel(null);
                // Reload the page or update the report list
                window.location.reload();
            } else {
                showToast("Failed to escalate report", true);
            }
        }).catch(error => {
            console.error("Error escalating report:", error);
            showToast("An error occurred while escalating the report", true);
        });
    }

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  // Check if report has moderator data
  const hasModeratorData = currentReport.moderatorDescription && 
                          currentReport.moderatorDescription.length > 0;
  
  // Determine status styling
  const getStatusColor = () => {
    if (hasModeratorData) {
      if (currentReport.moderatorDescription[0].approvedAt) return "#4CAF50"; // Green for approved
      return "#F44336"; // Red for rejected
    }
    return "#FF9800"; // Orange for pending
  };
  
  const getStatusText = () => {
    if (hasModeratorData) {
      if (currentReport.moderatorDescription[0].approvedAt) return "Approved";
      return "Rejected";
    }
    return "Pending";
  };

  return (
    <div className="reportPopupContainer" style={{ 

    }}>
      {/* Close button
      <div 
        onClick={closeReport}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: "#f0f0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "bold",
          zIndex: 10,
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}
      >
        ✕
      </div> */}
      {/* Status Badge */}
      <div style={{ 
        background: getStatusColor(),
        color: "white",
        padding: "5px 10px",
        borderRadius: "4px",
        display: "inline-block",
        marginBottom: "10px",
        fontSize: "14px",
        fontWeight: "bold"
      }}>
        {getStatusText()}
      </div>

      {/* Moderator Section - Shown if available */}
      {hasModeratorData && (
        <div style={{ 
          backgroundColor: "#f1f7fa", 
          padding: "12px",
          marginBottom: "15px",
          borderRadius: "6px",
          borderLeft: `4px solid ${getStatusColor()}`
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>Moderator Review</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: "10px" }}>
            <div>
              <label style={{ fontWeight: "bold", fontSize: "12px", color: "#546e7a" }}>Moderator</label>
              <p style={{ margin: "0 0 8px 0" }}>{currentReport.moderatorDescription[0].moderatorName}</p>
            </div>
            
            <div>
              <label style={{ fontWeight: "bold", fontSize: "12px", color: "#546e7a" }}>Reviewed On</label>
              <p style={{ margin: "0 0 8px 0" }}>{formatDate(currentReport.moderatorDescription[0].lastModeratedAt)}</p>
            </div>
            

            
            <div>
              <label style={{ fontWeight: "bold", fontSize: "12px", color: "#546e7a" }}>Fire Contained</label>
              <p style={{ margin: "0 0 8px 0" }}>{currentReport.moderatorDescription[0].fireContained ? "Yes" : "No"}</p>
            </div>
                        {currentReport.moderatorDescription[0].approvedAt && (
              <div>
                <label style={{ fontWeight: "bold", fontSize: "12px", color: "#546e7a" }}>Approved On</label>
                <p style={{ margin: "0 0 8px 0" }}>{formatDate(currentReport.moderatorDescription[0].approvedAt)}</p>
              </div>
            )}
          </div>
          
          
          <div style={{ marginTop: "10px" }}>
            <label style={{ fontWeight: "bold", fontSize: "12px", color: "#546e7a" }}>Background</label>
            <p style={{ margin: "0 0 8px 0", fontSize: "13px" }}>{currentReport.moderatorDescription[0].moderatorBackground || "Not provided"}</p>
          </div>
          
          <div style={{ marginTop: "10px" }}>
            <label style={{ fontWeight: "bold", fontSize: "12px", color: "#546e7a" }}>Notes</label>
            <p style={{ 
              margin: "0", 
              padding: "8px",
              backgroundColor: "#ffffff",
              borderRadius: "4px",
              fontSize: "13px",
              border: "1px solid #e0e0e0"
            }}>{currentReport.moderatorDescription[0].description || "No notes provided"}</p>
          </div>
        </div>
      )}

      {/* Report Details Section */}
      <div style={{ 
        backgroundColor: "#f5f5f5", 
        padding: "12px",
        borderRadius: "6px",
        marginBottom: "15px"
      }}>
        <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#2c3e50" }}>Report Details</h3>
        
        <p style={{ 
          margin: "0 0 10px 0", 
          padding: "8px", 
          backgroundColor: "#ffffff", 
          borderRadius: "4px", 
          fontSize: "13px"
        }}>{currentReport.description}</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div>
            <label style={{ fontWeight: "bold", fontSize: "12px", color: "#546e7a" }}>Reported By</label>
            <p style={{ margin: "0 0 8px 0" }}>{currentReport.author}</p>
          </div>
          
          <div>
            <label style={{ fontWeight: "bold", fontSize: "12px", color: "#546e7a" }}>Report Type</label>
            <p style={{ margin: "0 0 8px 0", textTransform: "capitalize" }}>{currentReport.type || "N/A"}</p>
          </div>
          
          <div>
            <label style={{ fontWeight: "bold", fontSize: "12px", color: "#546e7a" }}>Severity</label>
            <p style={{ margin: "0 0 8px 0", textTransform: "capitalize" }}>{currentReport.severity || "N/A"}</p>
          </div>
          
          <div>
            <label style={{ fontWeight: "bold", fontSize: "12px", color: "#546e7a" }}>Reported At</label>
            <p style={{ margin: "0 0 8px 0" }}>{formatDate(currentReport.reportedAt)}</p>
          </div>
        </div>
        
        <div style={{ marginTop: "10px" }}>
          <label style={{ fontWeight: "bold", fontSize: "12px", color: "#546e7a" }}>Location</label>
          <div className="splitRow" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "11px", color: "#757575" }}>Longitude</label>
              <p style={{ margin: "0", fontWeight: "bold" }}>{currentReport.location.longitude.toFixed(4)}</p>
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#757575" }}>Latitude</label>
              <p style={{ margin: "0", fontWeight: "bold" }}>{currentReport.location.latitude.toFixed(4)}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Image Display - if there's an image */}
      {currentReport.image && (
        <div style={{ 
          marginBottom: "15px",
          overflow: "hidden",
          borderRadius: "6px"
        }}>
          <img 
            src={currentReport.image} 
            alt="Report image" 
            style={{ 
              width: "100%", 
              height: "auto",
              objectFit: "cover" 
            }} 
          />
        </div>
      )}
      
      {/* Action Buttons - Only shown for not yet moderated reports */}
      {currentReport.moderatorDescription.length === 0 && (
        <div className="reportActions" style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "10px",
          marginTop: "15px"
        }}>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            className="approveButton" 
            onClick={() => handleModeratorPanel("approve")}
            style={{
              backgroundColor: "#4CAF50",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            Approve
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            className="rejectButton" 
            onClick={() => handleModeratorPanel("reject")}
            style={{
              backgroundColor: "#F44336",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            Reject
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            className="escalateButton" 
            onClick={() => handleModeratorPanel("escalate")}
            style={{
              backgroundColor: "#FF9800",
              color: "white",
              padding: "10px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontWeight: "bold",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            Escalate
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {moderatorPanel && (
          <motion.div 
            className="moderatorWindow"
            initial={{ height: 0, opacity: 0 }}
            animate={{ 
              height: "auto", 
              opacity: 1,
              transition: {
                height: { duration: 0.25, ease: "easeOut" },
                opacity: { duration: 0.2, delay: 0.15 }
              }
            }}
            exit={{ 
              height: 0, 
              opacity: 0,
              transition: {
                height: { duration: 0.3, delay: 0.2, ease: "easeOut" },
                opacity: { duration: 0.2, ease: "easeOut" }
              }
            }}
            style={{
              marginTop: "15px",
              padding: "15px",
              backgroundColor: "#ffffff",
              borderRadius: "6px",
              boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
              border: `1px solid ${
                moderatorPanel === "approve" ? "#4CAF50" :
                moderatorPanel === "reject" ? "#F44336" : "#FF9800"
              }`
            }}
          >
            <h4 style={{
              margin: "0 0 15px 0",
              color: moderatorPanel === "approve" ? "#4CAF50" :
                    moderatorPanel === "reject" ? "#F44336" : "#FF9800",
              borderBottom: `1px solid ${
                moderatorPanel === "approve" ? "#4CAF50" :
                moderatorPanel === "reject" ? "#F44336" : "#FF9800"
              }`,
              paddingBottom: "8px"
            }}>
              {moderatorWindowStrings[moderatorPanel].Title}
            </h4>

            <form style={{ marginBottom: "15px" }}>
              <label 
                htmlFor="moderatorDescription"
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                  color: "#546e7a"
                }}
              >
                Moderator Notes:
              </label>
              <textarea
                id="moderatorDescription"
                name="moderatorDescription"
                rows="4"
                className="moderatorDescription"
                placeholder={moderatorWindowStrings[moderatorPanel].inputPlaceholder}
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  fontSize: "14px",
                  resize: "vertical"
                }}
              ></textarea>
              
              {/* Additional fields - can be expanded */}
              <div style={{ marginTop: "15px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "bold",
                  color: "#546e7a"
                }}>
                  Fire Contained:
                </label>
                <div style={{ display: "flex", gap: "15px" }}>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="fireContained" 
                      value="yes" 
                      style={{ marginRight: "5px" }}
                    />
                    Yes
                  </label>
                  <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                    <input 
                      type="radio" 
                      name="fireContained" 
                      value="no" 
                      style={{ marginRight: "5px" }}
                      defaultChecked
                    />
                    No
                  </label>
                </div>
              </div>
              
              <div style={{ marginTop: "15px" }}>
                <label 
                  htmlFor="moderatorBackground"
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    fontWeight: "bold",
                    color: "#546e7a"
                  }}
                >
                  Background Information (optional):
                </label>
                <textarea
                  id="moderatorBackground"
                  name="moderatorBackground"
                  rows="2"
                  placeholder="Add any background information..."
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    fontSize: "14px",
                    resize: "vertical"
                  }}
                ></textarea>
              </div>
            </form>
            
            <p style={{ 
              backgroundColor: "#FFF3E0", 
              padding: "10px", 
              borderRadius: "4px", 
              marginBottom: "15px",
              borderLeft: "4px solid #FF9800",
              fontSize: "14px"
            }}>
              {moderatorWindowStrings[moderatorPanel].submissionWarning}
            </p>
            
            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
              <button 
                className={`${moderatorPanel}Button`} 
                onClick={
                  moderatorPanel === "approve" ? submitApproval :
                  moderatorPanel === "reject" ? submitRejection : submitEscalation
                }
                style={{
                  backgroundColor: moderatorPanel === "approve" ? "#4CAF50" :
                                  moderatorPanel === "reject" ? "#F44336" : "#FF9800",
                  color: "white",
                  padding: "10px 20px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  flex: "1"
                }}
              >
                {moderatorWindowStrings[moderatorPanel].buttonText}
              </button>
              <button 
                className="cancelButton" 
                onClick={() => setModeratorPanel(null)}
                style={{
                  backgroundColor: "#f5f5f5",
                  color: "#333",
                  padding: "10px 20px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  cursor: "pointer",
                  flex: "1"
                }}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ReportPopup;
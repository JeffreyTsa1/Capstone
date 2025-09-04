"use client"
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '@auth0/nextjs-auth0';
import './reportPopup.css';
const moderatorWindowStrings = {
    "update": {"Title": "Update Report",
        "description": "Update information about this approved report.",
        "buttonText": "Update Report",
        "inputPlaceholder": "Enter update notes here...",
        "submissionWarning": "Your update will be added to the report history.",
        "buttonColor": "#3b82f6", // Blue for updates
        "buttonTextColor": "#fff" // White text for contrast
    },
    "contained": {"Title": "Mark as Contained",
        "description": "Mark this fire as contained or resolved.",
        "buttonText": "Mark as Contained",
        "inputPlaceholder": "Enter containment details here...",
        "submissionWarning": "Are you sure you want to mark this report as contained?",
        "buttonColor": "#10b981", // Green for contained
        "buttonTextColor": "#fff" // White text for contrast
    },
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
    
    const submitUpdate = () => {
        // API call to backend to update an approved report
        const body = {
            ...getModeratorFormData(),
            action: "update",
            reportID: currentReport?._id?.$oid,
            updateType: "information"
        };
        
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        }).then(response => {
            if (response.ok) {
                showToast("Report updated successfully");
                setModeratorPanel(null);
                // Reload the page or update the report list
                window.location.reload();
            } else {
                showToast("Failed to update report", true);
            }
        }).catch(error => {
            console.error("Error updating report:", error);
            showToast("An error occurred while updating the report", true);
        });
    }
    
    const submitContained = () => {
        // API call to backend to mark report as contained
        const body = {
            ...getModeratorFormData(),
            action: "update",
            reportID: currentReport?._id?.$oid,
            updateType: "contained",
            fireContained: true
        };
        
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        }).then(response => {
            if (response.ok) {
                showToast("Report marked as contained successfully");
                setModeratorPanel(null);
                // Reload the page or update the report list
                window.location.reload();
            } else {
                showToast("Failed to mark report as contained", true);
            }
        }).catch(error => {
            console.error("Error marking report as contained:", error);
            showToast("An error occurred while updating the report", true);
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
    <div className="reportPopupContainer">
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
      <div 
        className="statusBadge" 
        style={{ background: getStatusColor() }}
      >
        {getStatusText()}
      </div>

      {/* Update Actions - Only shown for approved reports */}
      {hasModeratorData && currentReport.moderatorDescription[0].approvedAt && canModerate && (
        <div className="approvedReportActions">
          <motion.button 
            whileHover={{ scale: 1.03 }}
            onClick={() => handleModeratorPanel("update")}
            className="actionButton updateButton"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Update Info
          </motion.button>
          
          {!currentReport.moderatorDescription[0].fireContained && (
            <motion.button 
              whileHover={{ scale: 1.03 }}
              onClick={() => handleModeratorPanel("contained")}
              className="actionButton containedButton"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Mark as Contained
            </motion.button>
          )}
          
          <motion.button 
            whileHover={{ scale: 1.03 }}
            onClick={() => handleModeratorPanel("escalate")}
            className="actionButton escalateActionButton"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 17l5-5-5-5M6 17l5-5-5-5"></path>
            </svg>
            Escalate
          </motion.button>
        </div>
      )}

      {/* Moderator Section - Shown if available */}
      {hasModeratorData && (
        <div 
          className="moderatorSection" 
          style={{ borderLeft: `4px solid ${getStatusColor()}` }}
        >
          <h3 className="moderatorSectionTitle">Moderator Review</h3>
          
          <div className="moderatorGrid">
            <div>
              <label className="fieldLabel">Moderator</label>
              <p className="fieldValue">{currentReport.moderatorDescription[0].moderatorName}</p>
            </div>
            
            <div>
              <label className="fieldLabel">Reviewed On</label>
              <p className="fieldValue">{formatDate(currentReport.moderatorDescription[0].lastModeratedAt)}</p>
            </div>
            
            <div>
              <label className="fieldLabel">Fire Contained</label>
              <p className="fieldValue">{currentReport.moderatorDescription[0].fireContained ? "Yes" : "No"}</p>
            </div>
                        {currentReport.moderatorDescription[0].approvedAt && (
              <div>
                <label className="fieldLabel">Approved On</label>
                <p className="fieldValue">{formatDate(currentReport.moderatorDescription[0].approvedAt)}</p>
              </div>
            )}
          </div>
          
          <div className="marginTop10">
            <label className="fieldLabel">Background</label>
            <p className="fieldValue backgroundInfo">{currentReport.moderatorDescription[0].moderatorBackground || "Not provided"}</p>
          </div>
          
          <div className="marginTop10">
            <label className="fieldLabel">Notes</label>
            <p className="moderatorNotes">{currentReport.moderatorDescription[0].moderatorDescription || "No notes provided"}</p>
          </div>
        </div>
      )}

      {/* Report Details Section */}
      <div className="reportDetailsSection">
        <h3 className="reportDetailsTitle">Report Details</h3>
        
        <p className="reportDescription">{currentReport.description}</p>
        
        <div className="reportDetailsGrid">
          <div>
            <label className="fieldLabel">Reported By</label>
            <p className="fieldValue">{currentReport.author}</p>
          </div>
          
          <div>
            <label className="fieldLabel">Report Type</label>
            <p className="fieldValue textCapitalize">{currentReport.type || "N/A"}</p>
          </div>
          
          <div>
            <label className="fieldLabel">Severity</label>
            <p className="fieldValue textCapitalize">{currentReport.severity || "N/A"}</p>
          </div>
          
          <div>
            <label className="fieldLabel">Reported At</label>
            <p className="fieldValue">{formatDate(currentReport.reportedAt)}</p>
          </div>
        </div>
        
        <div className="marginTop10">
          <label className="fieldLabel">Location</label>
          <div className="splitRow">
            <div>
              <label className="coordinateLabel">Longitude</label>
              <p className="coordinateValue">{currentReport.location.longitude.toFixed(4)}</p>
            </div>
            <div>
              <label className="coordinateLabel">Latitude</label>
              <p className="coordinateValue">{currentReport.location.latitude.toFixed(4)}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Image Display - if there's an image */}
      {currentReport.image && (
        <div className="reportImage">
          <img 
            src={currentReport.image} 
            alt="Report image" 
            className="reportImageImg"
          />
        </div>
      )}
      
      {/* Action Buttons - Only shown for not yet moderated reports */}
      {currentReport.moderatorDescription.length === 0 && (
        <div className="reportActions">
          <motion.button 
            whileHover={{ scale: 1.03 }}
            className="mainActionButton approveButton" 
            onClick={() => handleModeratorPanel("approve")}
          >
            Approve
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            className="mainActionButton rejectButton" 
            onClick={() => handleModeratorPanel("reject")}
          >
            Reject
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            className="mainActionButton escalateButton" 
            onClick={() => handleModeratorPanel("escalate")}
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
              border: `1px solid ${
                moderatorPanel === "approve" ? "#4CAF50" :
                moderatorPanel === "reject" ? "#F44336" : 
                moderatorPanel === "update" ? "#3b82f6" :
                moderatorPanel === "contained" ? "#10b981" : "#FF9800"
              }`
            }}
          >
            <h4 
              className="moderatorWindowTitle"
              style={{
                color: moderatorPanel === "approve" ? "#4CAF50" :
                      moderatorPanel === "reject" ? "#F44336" : 
                      moderatorPanel === "update" ? "#3b82f6" :
                      moderatorPanel === "contained" ? "#10b981" : "#FF9800",
                borderBottom: `1px solid ${
                  moderatorPanel === "approve" ? "#4CAF50" :
                  moderatorPanel === "reject" ? "#F44336" : 
                  moderatorPanel === "update" ? "#3b82f6" :
                  moderatorPanel === "contained" ? "#10b981" : "#FF9800"
                }`
              }}
            >
              {moderatorWindowStrings[moderatorPanel].Title}
            </h4>

            <form className="moderatorForm">
              <label 
                htmlFor="moderatorDescription"
                className="moderatorLabel"
              >
                Moderator Notes:
              </label>
              <textarea
                id="moderatorDescription"
                name="moderatorDescription"
                rows="4"
                className="moderatorTextArea moderatorTextarea"
                placeholder={moderatorWindowStrings[moderatorPanel].inputPlaceholder}
              ></textarea>
              
              {/* Additional fields - can be expanded */}
              <div className="fireContainedSection">
                <label className="moderatorLabel">
                  Fire Contained:
                </label>
                <div className="fireContainedOptions">
                  <label className="fireContainedOption">
                    <input 
                      type="radio" 
                      name="fireContained" 
                      value="yes" 
                      className="fireContainedRadio"
                    />
                    Yes
                  </label>
                  <label className="fireContainedOption">
                    <input 
                      type="radio" 
                      name="fireContained" 
                      value="no" 
                      className="fireContainedRadio"
                      defaultChecked
                    />
                    No
                  </label>
                </div>
              </div>
              
              <div className="backgroundSection">
                <label 
                  htmlFor="moderatorBackground"
                  className="moderatorLabel"
                >
                  Background Information (optional):
                </label>
                <textarea
                  id="moderatorBackground"
                  name="moderatorBackground"
                  className='moderatorTextArea moderatorTextarea'
                  rows="2"
                  placeholder="Add any background information..."
                ></textarea>
              </div>
            </form>
            
            <p className="submissionWarning">
              {moderatorWindowStrings[moderatorPanel].submissionWarning}
            </p>
            
            <div className="moderatorButtonGroup">
              <button 
                className={`moderatorSubmitButton ${moderatorPanel}Button`} 
                onClick={
                  moderatorPanel === "approve" ? submitApproval :
                  moderatorPanel === "reject" ? submitRejection : 
                  moderatorPanel === "update" ? submitUpdate :
                  moderatorPanel === "contained" ? submitContained : submitEscalation
                }
                style={{
                  backgroundColor: moderatorPanel === "approve" ? "#4CAF50" :
                                  moderatorPanel === "reject" ? "#F44336" : 
                                  moderatorPanel === "update" ? "#3b82f6" :
                                  moderatorPanel === "contained" ? "#10b981" : "#FF9800"
                }}
              >
                {moderatorWindowStrings[moderatorPanel].buttonText}
              </button>
              <button 
                className="cancelButton" 
                onClick={() => setModeratorPanel(null)}
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
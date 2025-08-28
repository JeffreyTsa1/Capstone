"use client";
import { useEffect, useState, useRef } from 'react'; // Add useRef for scroll references
import styles from './page.module.css'; // Adjust the path as necessary
import EditInput from './EditInput'; // Import the EditInput component
import AddressSearch from '@/components/AddressSearch';
import { motion, AnimatePresence } from 'motion/react';
import { appStore } from '../../../store/Store'; // Import your store for user data management
import { updateUser } from '@/lib/api'; // Import API helper
import { useRouter } from 'next/navigation';
const page = () => {

  const router = useRouter();
  const userData = appStore((state) => state.userData);
  const setUserData = appStore((state) => state.setUser);
  const [userDataDB, setUserDataDB] = useState(null);

  // Initialize form state with empty values first
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addresses, setAddresses] = useState([]); // Array to store multiple addresses
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  // Effect to populate form data when userData changes
  useEffect(() => {
    if (userData) {
      // Update form fields with userData
      setEmail(userData.email || "");
      setFirstName(userData.firstName || "");
      setLastName(userData.lastName || "");
      
      // If addresses are available in userData, use them
      if (userData.addresses && Array.isArray(userData.addresses)) {
        setAddresses(userData.addresses);
      }
      else if (userData.address) {
        // If only a single address exists, convert it to the new format
        setAddresses([{
          label: "Home",
          address: userData.address,
          properties: {
            full_address: userData.address,
            coordinates: {
              latitude: userData.location ? userData.location[0] : null,
              longitude: userData.location ? userData.location[1] : null
            }
          },
          isPrimary: true
        }]);
      }

    }
    setShowSettingsMenu(true);
  }, [userData]);
  const [tempAddress, setTempAddress] = useState(null); // Temporary address before saving with label
  const [addressLabel, setAddressLabel] = useState(""); // Label for the current address
  const [showAddressForm, setShowAddressForm] = useState(false); // Control visibility of address form
  const [editingAddressIndex, setEditingAddressIndex] = useState(-1); // For editing existing addresses
  console.log("User Data:", userData);
  // Ref for scrolling to bottom when needed
  const scrollAnchorRef = useRef(null);
  
  // Function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollAnchorRef.current) {
      scrollAnchorRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  // Handle address selection from AddressSearch component
  const handleAddressSelect = (address) => {
    setTempAddress(address);
    // Focus the label input and scroll to ensure it's visible
    setTimeout(() => {
      const labelInput = document.getElementById("addressLabelInput");
      if (labelInput) {
        labelInput.focus();
        scrollToBottom();
      }
    }, 100);
  };
  
  // Add new address with label to the addresses array
  const addAddress = () => {
    if (!tempAddress || !addressLabel.trim()) return;
    
    const newAddress = {
      ...tempAddress,
      label: addressLabel.trim(),
      id: Date.now() // Simple unique ID
    };
    
    if (editingAddressIndex >= 0) {
      // Edit existing address
      const updatedAddresses = [...addresses];
      updatedAddresses[editingAddressIndex] = newAddress;
      setAddresses(updatedAddresses);
      setEditingAddressIndex(-1);
    } else {
      // Add new address
      setAddresses([...addresses, newAddress]);
    }
    
    // Reset form
    setTempAddress(null);
    setAddressLabel("");
    setShowAddressForm(false);
  };
  
  // Delete an address
  const deleteAddress = (index) => {
    const updatedAddresses = addresses.filter((_, i) => i !== index);
    setAddresses(updatedAddresses);
  };
  
  // Edit an existing address
  const editAddress = (index) => {
    const addressToEdit = addresses[index];
    setTempAddress(addressToEdit);
    setAddressLabel(addressToEdit.label);
    setEditingAddressIndex(index);
    setShowAddressForm(true);
    
    // Scroll to the form after it's visible
    setTimeout(scrollToBottom, 100);
  };
  

  const saveSettings = async (e) => {
    // If there's an event, prevent default behavior
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    
    // Save the settings to backend or local storage
    if (!userData) {
      alert("Please log in to save your settings");
      return;
    }
    
    // Prepare data to save with user ID from userData
    console.log("Current userData:", userData);
    
    // Example of how you might save to your backend
    try {
      // Create object with all the data to update
      const newUserData = {
        userID: userData.userID,
        email,
        firstName,
        lastName,
        addresses // Include the addresses array
      };
      
      // Only include fields that have changed
      const updateData = {};
      for (let key in newUserData) {
        if (newUserData[key] !== userData?.[key]) {
          updateData[key] = newUserData[key];
        }
      }
      
      console.log("Data to update:", updateData);
      
      // Only proceed if there are changes to save
      if (Object.keys(updateData).length === 0) {
        alert("No changes detected!");
        return;
      }
      
      // Use the API helper to update the user
      const result = await updateUser({
        userID: userData.userID,
        ...updateData
      });
      
      if (result.success) {
        alert("Settings saved successfully!");
        
        // Update local state in the store
        const updatedUserData = {
          ...userData,
          ...updateData
        };
        setUserData(updatedUserData);
      } else {
        alert(result.error || "Failed to save settings. Please try again.");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("An error occurred while saving your settings.");
    }
  }
  const navigateBack = () => {
    setShowSettingsMenu(false);
    setTimeout(() => {  
      router.back();
    }, 1000); // Delay of 5 seconds

  }
  
const panelVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit:   { opacity: 0, y: 20 },
};

const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 0.5 },
  exit:    { opacity: 0 },
};
  // This useEffect is not needed anymore since we're using the userData from the app store
  // and we're handling the initialization in the other useEffect
  // We'll keep a commented version for reference
  /*
  useEffect(() => {
    const checkUserData = async () => {
      if (!userData || !userData.userID) return;
      
      console.log("Settings page loaded with user data:", userData);
      // Additional initialization logic could go here if needed
    };
    
    checkUserData();
  }, [userData]);
  */

  // const userData = dataStore
  return (
    <div className={styles.settingsPageWrapper}>
      <AnimatePresence
        mode="wait"
        onExitComplete={() => {
          router.back();
        }}
      >
       {showSettingsMenu &&( <>
      <motion.div className={styles.settingsBlackOverlay} initial="hidden" animate="visible" exit="exit"
        transition={{ duration: 0.2 }}
        variants={overlayVariants}
        >
          .
        </motion.div>

      <motion.div className={styles.settingsPageContent}
              initial="hidden"
        animate="visible"
        exit="exit"
        variants={panelVariants}
        transition={{ duration: 0.3, delay: 0.2, ease: "easeOut" }}
      >
        <div className={styles.closeButtonContainer}>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className={styles.closeButton} onClick={() => {
            setShowSettingsMenu(false);
            }}>
            ✕
          </motion.button>
        </div>
      <h1>
          Settings
      </h1>
      <p>
          This is your settings page. You can adjust your preferences here.

      </p>

        <div className={styles.settingsForm}>
            <form onSubmit={(e) => e.preventDefault()}>
                <br />
                <label>
                    <input type="checkbox" name="notifications" />
                    Enable Notifications
                </label>
                <EditInput category={"Email"} inputValue={email} setInputValue={setEmail} />
                <EditInput category={"First Name"} inputValue={firstName} setInputValue={setFirstName} />
                <EditInput category={"Last Name"} inputValue={lastName} setInputValue={setLastName} />
                <div className={styles.addressesSection}>
                  <h3>Your Addresses</h3>
                  
                  {/* Display saved addresses */}
                  <div className={styles.savedAddresses}>
                    {addresses.length === 0 ? (
                      <p className={styles.noAddressesMessage}>No addresses saved yet. Add your first address below.</p>
                    ) : (
                      <ul className={styles.addressList} style={{ marginTop: "10px"}}>
                        {addresses.map((address, index) => (
                          <motion.li 
                            key={address.id + address.label} 
                            className={styles.addressItem}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className={styles.addressInfo}>
                              <strong>{address.label}</strong>
                              <p>{address.address}</p>
                            </div>
                            <div className={styles.addressActions}>
                              <button 
                                type="button" 
                                className={styles.editButton}
                                onClick={() => editAddress(index)}
                              >
                                Edit
                              </button>
                              <button 
                                type="button" 
                                className={styles.deleteButton}
                                onClick={() => deleteAddress(index)}
                              >
                                Delete
                              </button>
                            </div>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  {/* Add address button */}
                  {!showAddressForm && (
                    <motion.button
                      type="button"
                      className={styles.addAddressButton}
                      onClick={() => {
                        setShowAddressForm(true);
                        setEditingAddressIndex(-1);
                        setTempAddress(null);
                        setAddressLabel("");
                        // Scroll after state update and render
                        setTimeout(scrollToBottom, 100);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      + Add New Address
                    </motion.button>
                  )}
                  
                  {/* Address form */}
                  <AnimatePresence>
                    {showAddressForm && (
                      <motion.div 
                        className={styles.addressFormContainer}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4>{editingAddressIndex >= 0 ? "Edit Address" : "Add New Address"}</h4>
                        
                        <AddressSearch 
                          onAddressSelect={handleAddressSelect}
                          placeholder="Search for your address"
                          initialValue={(tempAddress && tempAddress.properties && tempAddress.properties.full_address) ? tempAddress.properties.full_address : ""}
                          textColor='black'
                          backgroundColor='#EAEAEA'
                        />
                        
                        {tempAddress && (
                          <motion.div 
                            className={styles.addressLabelContainer}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                          >
                            <label htmlFor="addressLabelInput">Address Label (e.g. Home, Work)</label>
                            <input
                              id="addressLabelInput"
                              type="text"
                              value={addressLabel}
                              onChange={(e) => setAddressLabel(e.target.value)}
                              placeholder="Enter a label for this address"
                              className={styles.labelInput}
                            />
                            
                            <div className={styles.addressFormActions}>
                              <motion.button
                                type="button"
                                className={styles.saveAddressButton}
                                onClick={addAddress}
                                disabled={!addressLabel.trim()}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {editingAddressIndex >= 0 ? "Update Address" : "Save Address"}
                              </motion.button>
                              
                              <motion.button
                                type="button"
                                className={styles.cancelButton}
                                onClick={() => {
                                  setShowAddressForm(false);
                                  setTempAddress(null);
                                  setAddressLabel("");
                                  setEditingAddressIndex(-1);
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Cancel
                              </motion.button>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                
                {/* Scroll anchor element */}
                <div ref={scrollAnchorRef} className={styles.scrollAnchor}></div>

                <div className={styles.saveSettingsButton}>
                  <motion.button 
                    whileHover={{ scale: 1.1 }} 
                    type="button" 
                    onClick={() => saveSettings()}
                  >
                    Save Settings
                  </motion.button>
                </div>
            </form>
        </div>
      </motion.div>
        </>
)}
      </AnimatePresence>
      </div>

  )
}

export default page
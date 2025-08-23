"use client";
import { useEffect, useState, useRef } from 'react'; // Add useRef for scroll references
import styles from './page.module.css'; // Adjust the path as necessary
import EditInput from './EditInput'; // Import the EditInput component
import AddressSearch from '@/components/AddressSearch';
import { motion, AnimatePresence } from 'motion/react';
import { appStore } from '../../../store/Store'; // Import your store for user data management
const page = () => {

  const userData = appStore((state) => state.userData);
  const setUser = appStore((state) => state.setUser);
  const [userDataDB, setUserDataDB] = useState(null);


  // What happens when the user isn't onboarded? 
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [addresses, setAddresses] = useState([]); // Array to store multiple addresses
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
  

  const saveSettings = async () => {
    // Save the settings to your backend or local storage
    if (!user) {
      alert("Please log in to save your settings");
      return;
    }
    
    // Prepare data to save
    const userData = {
      userId: user.sub,
      email,
      firstName,
      lastName,
      addresses // Include the addresses array
    };
    
    console.log("Saving settings:", userData);
    
    // Example of how you might save to your backend
    try {
      // Uncomment this when your API is ready
      /*
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        alert("Settings saved successfully!");
      } else {
        alert("Failed to save settings. Please try again.");
      }
      */
      
      // For now, just show a success message
      alert("Settings would be saved here! (API not connected)");
      
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("An error occurred while saving your settings.");
    }
  }


  useEffect(() => {
    const checkUserInDatabase = async () => {
      // Only check if we have a user from Auth0 and haven't checked yet
      if (!user || isLoading || checkingUser || userExistsInDB !== null) return;
      
      setCheckingUser(true);
      console.log("Checking if user exists in database:", user.sub);
      
      try {
        // First check if user exists in Users collection
        const userResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/check/${user.sub}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (userResponse.status === 200) {
          const userData = await userResponse.json();
          console.log("User data from Users collection:", userData);
        }
        
        
      } catch (error) {
        console.error("Error checking user in database:", error);
        setUserExistsInDB(false);
      } finally {
        setCheckingUser(false);
      }
    }
    checkUserInDatabase();
  }, []);

  // const userData = dataStore
  return (
    <div className={styles.settingsPageWrapper}>
      <div className={styles.settingsPageContent}>
        
      <h1>
          Settings
      </h1>
      <p>

          This is your settings page. You can adjust your preferences here.

      </p>

        <div className={styles.settingsForm}>
            <h2>General Settings</h2>
            <p>Adjust your general preferences here.</p>
            <form>
                <label>
                    <input type="checkbox" name="notifications" />
                    Enable Notifications
                </label>
                <br />
                <EditInput category={"Email"} inputValue={userData?.email} />
                <EditInput category={"First Name"} inputValue={userData?.firstName} />
                <EditInput category={"Last Name"} inputValue={userData?.lastName} />
                <div className={styles.addressesSection}>
                  <h3>Your Addresses</h3>
                  
                  {/* Display saved addresses */}
                  <div className={styles.savedAddresses}>
                    {addresses.length === 0 ? (
                      <p className={styles.noAddressesMessage}>No addresses saved yet. Add your first address below.</p>
                    ) : (
                      <ul className={styles.addressList}>
                        {addresses.map((address, index) => (
                          <motion.li 
                            key={address.id} 
                            className={styles.addressItem}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className={styles.addressInfo}>
                              <strong>{address.label}</strong>
                              <p>{address.properties.full_address}</p>
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
                          initialValue={tempAddress?.properties?.full_address || ""}
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
                    type="submit" 
                    onClick={(e) => {
                      e.preventDefault();
                      saveSettings();
                    }}
                  >
                    Save Settings
                  </motion.button>
                </div>
            </form>
        </div>
    </div>
      </div>

  )
}

export default page
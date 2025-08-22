"use client";
import { useEffect, useState } from 'react'; // Import useState to manage local state
import styles from './page.module.css'; // Adjust the path as necessary
import EditInput from './EditInput'; // Import the EditInput component
import AddressSearch from '@/components/AddressSearch';
import { useUser } from "@auth0/nextjs-auth0"
import { motion } from 'motion/react';
const page = () => {
  const [userDataDB, setUserDataDB] = useState(null);


  // What happens when the user isn't onboarded? 
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [selectedAddress, setSelectedAddress] = useState(null);
  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    alert("Location set to: " + address.properties.full_address);
  };
  const { user, isLoading } = useUser();

  const saveSettings = async () => {
    // Save the settings to your backend or local storage
  
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
                <EditInput category={"Email"} />
                <EditInput category={"First Name"} />
                <EditInput category={"Last Name"} />
                <AddressSearch 
                  onAddressSelect={handleAddressSelect}
                  placeholder="Please enter your address"
                  textColor='white'
                  backgroundColor='#333'
                />

              <div
                className={styles.saveSettingsButton}
                >
                <motion.button whileHover={{ scale: 1.1 }} type="submit" onClick={() => saveSettings()}>Save Settings</motion.button>

              </div>
            </form>
        </div>
    </div>
      </div>

  )
}

export default page
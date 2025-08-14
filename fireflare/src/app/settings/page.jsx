import React from 'react'
import styles from './page.module.css'; // Adjust the path as necessary


const page = () => {
  // const userData = dataStore
  return (
    <div>
      <h1>
          Settings Page
      </h1>
      <p>

          This is the settings page. You can adjust your preferences here.

      </p>

        <div className={styles.settingsForm}>
            <h2>General Settings</h2>
            <p>Adjust your general preferences here.</p>
            <input type="text" placeholder="Enter your preference" />   
            <input type="text" placeholder="Enter your preference" />   
            <input type="text" placeholder="Enter your preference" />   
            <input type="text" placeholder="Enter your preference" />   
            <input type="text" placeholder="Enter your preference" />   
            <input type="text" placeholder="Enter your preference" />   
            <input type="text" placeholder="Enter your preference" />   
            <input type="text" placeholder="Enter your preference" />   
            <input type="text" placeholder="Enter your preference" />   
        </div>
    </div>
  )
}

export default page
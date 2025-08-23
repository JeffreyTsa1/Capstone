import React from 'react'
import styles from './page.module.css'; // Adjust the path as necessary
const EditInput = ({category, inputValue, setInputValue, placeholder}) => {
  return (
    <div className={styles.editInputWrapper}>
    <label>{category}</label>
    <input
      type="text"
      placeholder={category}
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      // className={`${styles.inputTextBox} ${styles.bigInput}`}
    />


    </div>
  )
}

export default EditInput
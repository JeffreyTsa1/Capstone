import React, { useState, useEffect } from 'react'
import styles from './page.module.css'; // Adjust the path as necessary
const EditInput = ({category, inputValue, setInputValue, placeholder}) => {
  // Internal state to handle undefined or null values
  const [value, setValue] = useState(inputValue ?? '');

  // Update internal state when prop changes
  useEffect(() => {
    setValue(inputValue ?? '');  // Use nullish coalescing to ensure we never set undefined
  }, [inputValue]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (setInputValue) {
      setInputValue(newValue);
    }
  };

  return (
    <div className={styles.editInputWrapper}>
    <label>{category}</label>
    <input
      type="text"
      placeholder={placeholder || category}
      value={value} // Use internal state which is guaranteed to be defined
      onChange={handleChange}
      // className={`${styles.inputTextBox} ${styles.bigInput}`}
    />


    </div>
  )
}

export default EditInput
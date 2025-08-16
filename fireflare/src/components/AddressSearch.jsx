"use client"
import { useState } from "react";
import { motion } from "motion/react";
import { fetchCoordsFromAddress } from "../lib/api/fetchCoordsFromAddress";
import "./components.css";

const AddressSearch = ({ 
  onAddressSelect, 
  placeholder = "Please enter your address",
  initialValue = "",
  textColor = "black",
backgroundColor = "white",

}) => {
  const [results, setResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialValue);

  const handleAddressInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // prevent form submission on enter
      if (searchQuery.trim() === "") {
        setResults([]); // clear results if input is empty
        return;
      }
      if (searchQuery) {
        const encodedSearchQuery = encodeURIComponent(searchQuery);
        findUserLocation(encodedSearchQuery);
      }
    }
  };

  const findUserLocation = async (query) => {
    try {
      const data = await fetchCoordsFromAddress(query);
      console.log(data);
      setResults(data.data.features);
    } catch (error) {
      console.error("Error finding location:", error);
      setResults([]);
    }
  };

  const handleAddressSelection = (result, index) => {
    const selectedAddress = results[index];
    setSearchQuery(result.properties.full_address);
    setResults([]);
    
    // Call the parent callback with the selected address
    if (onAddressSelect) {
      onAddressSelect(selectedAddress);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      const encodedSearchQuery = encodeURIComponent(searchQuery);
      findUserLocation(encodedSearchQuery);
    }
  };

  return (
    <div className="addressSearchWrapper">
        <label>Address</label>
      <div className="rowSplitAddress">
        <input 
          type="text"
          name="address"
          placeholder={placeholder}
          onKeyDown={handleAddressInputKeyDown}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
          value={searchQuery}
          className={"addressSearchInput"}
        />
        <motion.button 
          className={"onboardingSearchButton"}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleSearch}
        >
          Search
        </motion.button>
      </div>
      
      <motion.div
        className="onboardingResults"
        initial={{ opacity: 0, marginTop: "0px", height: "50px" }}
        animate={{
          opacity: results.length > 0 ? "1" : "0",
          height: results.length > 0 ? "auto" : "50px",
        }}
        transition={{
          duration: 0.1,
        }}
      >
        <motion.ul
          animate={{
            // opacity: results.length > 0 ? "1" : "0",
          }}
          transition={{
            duration: 0.2,
            delay: 0.4
          }}
        >
          {results && results.map((result, index) => {
            console.log(result);
            return (
              <li
                key={index}
                onClick={() => handleAddressSelection(result, index)}
              >
                {result.properties.full_address}
              </li>
            );
          })}
        </motion.ul>
      </motion.div>
    </div>
  );
};

export default AddressSearch;

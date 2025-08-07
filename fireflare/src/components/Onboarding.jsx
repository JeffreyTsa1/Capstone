"use client"
import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
import { motion } from "framer-motion"
import { fetchCoordsFromAddress } from "../../lib/api/fetchCoordsFromAddress";
import "./Welcome.css";
import { markerStore } from "../../store/markerStore";
// import { useUser } from "@auth0/nextjs-auth0"
// import { auth0 } from "../../lib/auth0";

const Onboarding = ({onComplete, user}) => {
    // const router = useRouter();
    const [results, setResults ] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [formComplete, setFormComplete] = useState(false);
    // const { user, isLoading, error } = useUser()
    
    
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phone, setPhone] = useState("")
    const [age, setAge] = useState("")
    
    const setUserLocationStore = markerStore((state) => state.setUserLocation);



  const handleAddressInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // prevent form submission on enter
      if (searchQuery) {
        const encodedSearchQuery = encodeURIComponent(searchQuery || "");
        findUserLocation(encodedSearchQuery)  
      }
    }
    
  };

  const findUserLocation = async (query) => {
    fetchCoordsFromAddress(query).then((data) => {
      console.log(data)
          setResults(data.data.features);
          console.log(results)
    }
    );
  }

  console.log("Outside useEffect - current user:", user);


  // console.log("User: ", user)
  // console.log(user.name)

  //   useEffect(() => {
  //   const handleGlobalKeyDown = (e) => {
  //     if (e.key === 'Enter') {
  //       if (!isInputFocused && !selectedAddress) {
  //         searchForAddress();
  //       } else if (selectedAddress && formComplete) {
  //         submitForm();
  //       }
  //     }
  //   };

  //   window.addEventListener('keydown', handleGlobalKeyDown);
  //   return () => {
  //     window.removeEventListener('keydown', handleGlobalKeyDown);
  //   };
  // }, [isInputFocused, searchQuery, selectedAddress, formComplete]);





    // const close = () => router.back()


    const submitUserInfo = async (e) => {
      e.preventDefault();

      if (!firstName || !lastName || !phone || !age || !selectedAddress || !user) {
        alert("Please fill in all required fields.");
        return;
      }

      try {
        // console.log("Submitting User Info");
        // console.log({ firstName, lastName, phone, age, selectedAddress, user });
        const res = await fetch("http://127.0.0.1:5000/onboardUser", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ firstName, lastName, phone, age, selectedAddress, user}),
            cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to onboard user");

        if (res.status === 200) {
          console.log("User onboarded successfully");
          onComplete();
        }
      } catch (err) {
        console.error("Error submitting user info:", err);
        alert("There was an error submitting your info. Please try again.");
      }
    }

    
  return (
    <div className="backgroundOverlay">
        <div className="onboardingWrapper">
            <div className="onboardingContent"> 
                <div style={{
                    textAlign: "left !important",
                    width: "100%",
                }}>
                    <h3>Onboarding</h3>
                    <p> Before you continue, we just need a little bit of information about you </p>
                </div>
                <form>
                <div className="rowSplit">
                    <input 
                        type="text"
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First Name"
                        className='inputTextBox onboarding bigInput'
                    />
                    <input 
                        type="text"
                        placeholder="First Name"
                        onChange={(e) => setLastName(e.target.value)}
                        className='inputTextBox bigInput'
                    />
                </div>
                <div className="rowSplit">
                    <div className="rowSplit"
                      style={{
                          width: "100%",
                      }}
                    >

                    <input 
                        type="text"
                        placeholder="Phone Number"
                        onChange={(e) => setPhone(e.target.value)}
                        className='inputTextBox bigInput'
                    />

                    {/************************************************ Still need to build verification systme *************************************************/}
                    <button className="onboardingVerify">
                        Verify
                    </button>
                    </div>

                    <input 
                        type="text"
                        placeholder="Age"
                        onChange={(e) => setAge(e.target.value)}
                        className='inputTextBox smallInput'
                    />
                </div>

                <div className="rowSplitAddress">
                  <input 
                      type="text"
                      placeholder="Please enter your address"
                      onKeyDown={handleAddressInputKeyDown}

                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                      }}
                      value={searchQuery || ""}
                      className='inputTextBox bigInput addressInput'
                      />
                      <button 
                      className="onboardingSearchButton"
                      onClick={(event)=>{
                        event.preventDefault();
                        const encodedSearchQuery = encodeURIComponent(searchQuery || "");
                        findUserLocation(encodedSearchQuery)  
                      }}>
                        Search
                      </button>
                  </div>
        <motion.div
          className="onboardingResults"
          animate={{
            opacity: results.length > 0 ? "1" : "0",
            marginTop: results.length > 0 ? "-50px" : "0px",

          }}
          transition={{
            duration: 0.1,
          }}
        >
          <motion.ul
            animate= {{
              // opacity: results.length > 0 ? "1" : "0",
            }}
            transition={{
              duration: 0.2,
              delay: 0.4
            }}
          >
            { results && results.map((result, index) => {
              console.log(result)

              return (
                <li
                  key={index}
                  onClick={() => {
                    setSelectedAddress(results[index]);
                    setUserLocationStore({
                      lat: result.geometry.coordinates[1],
                      lng: result.geometry.coordinates[0],
                    });
                    alert("Location set to: " + result.properties.full_address);
                    setSearchQuery(result.properties.full_address);
                    setResults([]);
                  }}
                >
                  {result.properties.full_address}
                </li>
              );
            })}
          </motion.ul>
        </motion.div>
                </form>

                <div className="submitButtonWrapper">
                    <button 
                    type="submit"
                    className="submitButton"
                    onClick={(e)=> {
                      submitUserInfo(e)
                    }}
                    >Submit</button>
                </div>
        {/* <button onClick={()=> {
            close()
        }}>Back</button> */}
            </div>
        </div>
    </div>
  )
}

export default Onboarding
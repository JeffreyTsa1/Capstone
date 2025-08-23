"use client"
import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
import "./components.css";
import { motion } from "motion/react";
import AddressSearch from "./AddressSearch";

const Onboarding = ({setShowOnboarding, user}) => {
    // const router = useRouter();
    console.log(user)
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [formComplete, setFormComplete] = useState(false);
    // const { user, isLoading, error } = useUser()
    
    
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phone, setPhone] = useState("")
    const [age, setAge] = useState("")
    

  // const session = auth0.getSession()

  const handleAddressSelect = (address) => {
    setSelectedAddress(address);
    alert("Location set to: " + address.properties.full_address);
  };

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
        console.log("Submitting user info")

        console.log("Address: ", selectedAddress.properties.coordinates.latitude)
      e.preventDefault();

      if (!firstName || !lastName || !phone || !selectedAddress || !user) {
        alert("Please fill in all required fields.");
        return;
      }

      try {
        const bodyContent = JSON.stringify({ 
                    auth0Id: user.sub,
                    email: user.email,
                    firstName: firstName,
                    lastName: lastName,
                    location: [selectedAddress.properties.coordinates.latitude, selectedAddress.properties.coordinates.longitude],
                    address: selectedAddress.properties.full_address,
                    phone: phone,
                    // age: age,
            });
            console.log("Submitting User Info");
            console.log(bodyContent);
            console.log(`API_URL: ${process.env.NEXT_PUBLIC_API_URL}`);
        // console.log("Submitting User Info");
        // console.log({ firstName, lastName, phone, age, selectedAddress, user });
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${apiUrl}/users/create`, {
            method: "POST",
            headers: {

                // #6C2058
                "Content-Type": "application/json",
            },
            body: bodyContent,
            cache: "no-store",
        });

        if (!res.ok) throw new Error("Failed to onboard user");

        if ( res.status === 201) {
          console.log("User onboarded successfully");
          setShowOnboarding(false);
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
                        placeholder="Last Name"
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
                    {/* <button className="onboardingVerify">
                        Verify
                    </button> */}
                    </div>

                    {/* <input 
                        type="text"
                        placeholder="Age"
                        onChange={(e) => setAge(e.target.value)}
                        className='inputTextBox smallInput'
                    /> */}
                </div>
                <AddressSearch 
                  onAddressSelect={handleAddressSelect}
                  placeholder="Please enter your address"
                />
                </form>

                <div className="submitButtonWrapper">
                    <motion.button
                    type="submit"
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02 }}

                    className="submitButton"
                    onClick={(e)=> {
                      submitUserInfo(e)
                    }}
                    >Submit</motion.button>
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
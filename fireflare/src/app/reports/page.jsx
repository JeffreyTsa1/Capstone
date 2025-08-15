"use client"
import { useEffect } from "react"
const page = () => {
  useEffect(() => {
    try{
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/${userId}`)
        .then(response => response.json())
        .then(data => {
            console.log("Fetched reports:", data);
            // Handle the fetched data (e.g., set state)
        }

        ).catch(error => {
            console.error("Error fetching reports:", error);
        });
    } catch (error) {
        console.error("Error in useEffect:", error);

    }
    // Your effect logic here
  }, [])

  return (
    <div>page</div>
  )
}

export default page
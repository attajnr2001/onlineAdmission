// src/helpers/utils.js
import { useEffect, useState } from "react";

// Custom hook for fetching location IP
export const useLocationIP = () => {
  const [locationIP, setLocationIP] = useState("");

  useEffect(() => {
    const fetchLocationIP = async () => {
      try {
        const response = await fetch("https://api64.ipify.org?format=json");
        const data = await response.json();
        setLocationIP(data.ip);
      } catch (error) {
        console.error("Error fetching location IP:", error);
      }
    };

    fetchLocationIP();
  }, []);

  return locationIP;
};

// Function to get the platform type
export const getPlatform = () => {
  const userAgent = navigator.userAgent;
  if (/Mobi|Android/i.test(userAgent)) {
    return "mobile";
  } else if (/Tablet|iPad/i.test(userAgent)) {
    return "tablet";
  } else {
    return "desktop";
  }
};

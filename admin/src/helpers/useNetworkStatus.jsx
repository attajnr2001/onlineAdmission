import { useState, useEffect } from "react";

const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState("4g");
  const [showNetworkWarning, setShowNetworkWarning] = useState(false);

  useEffect(() => {
    const handleNetworkChange = () => {
      const connection =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
      
      if (!navigator.onLine) {
        setNetworkStatus("offline");
        setShowNetworkWarning(true);
      } else if (connection) {
        setNetworkStatus(connection.effectiveType);
        if (["2g", "slow-2g", "offline"].includes(connection.effectiveType)) {
          setShowNetworkWarning(true);
        } else {
          setShowNetworkWarning(false);
        }
      }
    };

    handleNetworkChange(); // Check network status on mount
    window.addEventListener("online", handleNetworkChange);
    window.addEventListener("offline", handleNetworkChange);
    if (navigator.connection) {
      navigator.connection.addEventListener("change", handleNetworkChange);
    }

    return () => {
      window.removeEventListener("online", handleNetworkChange);
      window.removeEventListener("offline", handleNetworkChange);
      if (navigator.connection) {
        navigator.connection.removeEventListener("change", handleNetworkChange);
      }
    };
  }, []);

  return { networkStatus, showNetworkWarning, setShowNetworkWarning };
};

export default useNetworkStatus;

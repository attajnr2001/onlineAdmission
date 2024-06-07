import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate instead of useHistory
import { auth } from "../helpers/firebase";
import { AuthContext } from "./AuthContext";

const UseAuth = () => {
    const { dispatch } = useContext(AuthContext);
    const navigate = useNavigate(); // Use useNavigate hook instead of useHistory

  useEffect(() => {
    const handleLogout = () => {
      auth.signOut().then(() => {
        localStorage.removeItem("userToken");
        dispatch({ type: "LOGOUT" });
        navigate("/login"); // Use navigate function instead of history.push
      });
    };

    let inactivityTimer;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(handleLogout, 30 * 60 * 1000); // 30 minutes
    };

    const events = ["mousemove", "mousedown", "keypress", "touchstart"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    window.addEventListener("beforeunload", handleLogout);

    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      window.removeEventListener("beforeunload", handleLogout);
      clearTimeout(inactivityTimer);
    };
  }, [navigate, dispatch]);

  return null;
};

export default UseAuth;

import React, { useState, useContext, useEffect } from "react";
import { auth, db } from "../helpers/firebase";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import {
  reauthenticateWithCredential,
  updatePassword,
  EmailAuthProvider,
} from "firebase/auth";
import { AuthContext } from "../context/AuthContext";
import { collection, addDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";

const ChangePassword = ({ open, onOpen, onClose }) => {
  const { schoolID } = useParams();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { currentUser } = useContext(AuthContext);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [locationIP, setLocationIP] = useState("127.58585.499"); // location IP to be fixed later
  const [currentDateTime, setCurrentDateTime] = useState(null);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const getPlatform = () => {
    const userAgent = navigator.userAgent;
    if (/Mobi|Android/i.test(userAgent)) {
      return "mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
      return "tablet";
    } else {
      return "desktop";
    }
  };

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
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        oldPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      await updatePassword(auth.currentUser, newPassword);
      setSnackbarMessage("Password updated successfully!");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);

      // Add log entry to database
      const logsCollection = collection(db, "logs");
      await addDoc(logsCollection, {
        action: "password changed",
        actionDate: currentDateTime,
        adminID: currentUser.email,
        locationIP: locationIP,
        platform: getPlatform(),
        schoolID: schoolID,
      });

      onClose();
    } catch (error) {
      console.error("Error updating password:", error);
      setSnackbarMessage("Error updating password: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    setOldPassword("");
    setNewPassword("");

    // Fetch current datetime from World Time API
    fetch("http://worldtimeapi.org/api/timezone/Africa/Accra")
      .then((response) => response.json())
      .then((data) => {
        const currentDateTime = data.datetime;
        setCurrentDateTime(currentDateTime);
      })
      .catch((error) => {
        console.error("Error fetching datetime from World Time API:", error);
      });
  }, [open]); // Reset state and fetch datetime when modal opens

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle id="form-dialog-title">Change Password</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="old-password"
              label="Old Password"
              type="password"
              fullWidth
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
            <TextField
              margin="dense"
              id="new-password"
              label="New Password"
              type="password"
              fullWidth
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose} color="primary">
              Cancel
            </Button>
            <Button type="submit" color="primary">
              Change
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ChangePassword;

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
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component

import { AuthContext } from "../context/AuthContext";
import { collection, addDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { useLocationIP, getPlatform } from "../helpers/utils";

const ChangePassword = ({ open, onOpen, onClose }) => {
  const { schoolID } = useParams();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { currentUser } = useContext(AuthContext);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const locationIP = useLocationIP();

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword) {
      setSnackbarMessage("Both password fields must be filled!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

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

      const response = await fetch(
        "http://worldtimeapi.org/api/timezone/Africa/Accra"
      );
      const data = await response.json();
      const dateTimeString = data.datetime;
      const logsCollection = collection(db, "logs");
      await addDoc(logsCollection, {
        action: "password changed",
        actionDate: dateTimeString,
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
  }, [open]);

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle id="form-dialog-title">Change Password</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              required
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
              required
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
      <NetworkStatusWarning />
    </>
  );
};

export default ChangePassword;

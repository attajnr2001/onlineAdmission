import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import { db, auth } from "../helpers/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useParams } from "react-router-dom";

const AddUserModal = ({ open, onClose, onAddUser }) => {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [locationIP, setLocationIP] = useState("");
  const [currentDateTime, setCurrentDateTime] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const { schoolID } = useParams();

  useEffect(() => {
    if (open) {
      setEmail("");
      setFullName("");
      setRole("");
      setPhone("");
    }
  }, [open]);

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

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleFullNameChange = (event) => {
    setFullName(event.target.value);
  };

  const handleRoleChange = (event) => {
    setRole(event.target.value);
  };

  const handlePhoneChange = (event) => {
    setPhone(event.target.value);
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

  const handleAddUser = async () => {
    if (!email || !fullName || !role || !phone) {
      setSnackbarOpen(true);
      setSnackbarMessage("Error: All fields are required.");
      return;
    }

    setIsAdding(true);

    try {
      const currentUser = auth.currentUser;

      const adminCollectionRef = collection(db, "admin");
      const currentUserQuery = query(
        adminCollectionRef,
        where("schoolID", "==", schoolID),
        where("email", "==", currentUser.email)
      );
      const currentUserSnapshot = await getDocs(currentUserQuery);

      if (
        currentUserSnapshot.empty ||
        currentUserSnapshot.docs[0].data().role !== "Super"
      ) {
        setSnackbarOpen(true);
        setSnackbarMessage(
          "Error: You do not have permission to add new admins."
        );
        setIsAdding(false);
        return;
      }

      const emailQuery = query(
        adminCollectionRef,
        where("schoolID", "==", schoolID),
        where("email", "==", email)
      );
      const emailQuerySnapshot = await getDocs(emailQuery);

      if (!emailQuerySnapshot.empty) {
        setSnackbarOpen(true);
        setSnackbarMessage("Error: Email already exists for this school.");
        setIsAdding(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        "123456"
      );
      const user = userCredential.user;

      await addDoc(adminCollectionRef, {
        email,
        fullName,
        role,
        phone,
        schoolID,
        active: true,
      });

      // Fetch current datetime from World Time API
      const response = await fetch(
        "http://worldtimeapi.org/api/timezone/Africa/Accra"
      );
      const data = await response.json();
      const dateTimeString = data.datetime;
      const dateTimeParts = dateTimeString.split(/[+\-]/);
      const dateTime = new Date(`${dateTimeParts[0]} UTC${dateTimeParts[1]}`);
      // Subtract one hour from the datetime
      dateTime.setHours(dateTime.getHours() - 1);

      // Log the addition of a new user
      const logsCollection = collection(db, "logs");
      await addDoc(logsCollection, {
        action: `Added new admin: ${fullName} with email: ${email}`,
        actionDate: dateTime,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
        schoolID: schoolID,
      });

      onClose();
      onAddUser();
      setSnackbarOpen(true);
      setSnackbarMessage("Admin added successfully!");
    } catch (error) {
      console.error("Error adding user:", error);
      setSnackbarOpen(true);
      setSnackbarMessage("Error adding user. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Admin</DialogTitle>
      <DialogContent>
        <TextField
          required
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={handleEmailChange}
        />
        <TextField
          required
          label="Full Name"
          type="text"
          fullWidth
          margin="normal"
          value={fullName}
          onChange={handleFullNameChange}
        />
        <TextField
          required
          label="Role"
          name="role"
          select
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
          value={role}
          onChange={handleRoleChange}
        >
          {["Super", "Admin"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          required
          label="Phone Number"
          type="text"
          fullWidth
          margin="normal"
          value={phone}
          onChange={handlePhoneChange}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleAddUser}
          disabled={isAdding}
        >
          {isAdding ? "Adding..." : "Add User"}
        </Button>
      </DialogContent>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          severity={snackbarMessage.includes("Error") ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default AddUserModal;

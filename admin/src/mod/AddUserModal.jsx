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
  const [role, setRole] = useState(""); // Set the default value to true
  const [phone, setPhone] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { schoolID } = useParams();

  useEffect(() => {
    if (open) {
      setEmail("");
      setFullName("");
      setRole("");
      setPhone("");
    }
  }, [open]);

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

  const handleAddUser = async () => {
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
        return;
      }

      // Add new user
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

      onClose();
      onAddUser();
      setSnackbarOpen(true);
      setSnackbarMessage("Admin added successfully!");
    } catch (error) {
      console.error("Error adding user:", error);
      setSnackbarOpen(true);
      setSnackbarMessage("Error adding user. Please try again.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Admin</DialogTitle>
      <DialogContent>
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={handleEmailChange}
        />
        <TextField
          label="Full Name"
          type="text"
          fullWidth
          margin="normal"
          value={fullName}
          onChange={handleFullNameChange}
        />
        <TextField
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
          label="Phone Number"
          type="text"
          fullWidth
          margin="normal"
          value={phone}
          onChange={handlePhoneChange}
        />
        <Button variant="contained" color="primary" onClick={handleAddUser}>
          Confirm
        </Button>
      </DialogContent>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
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

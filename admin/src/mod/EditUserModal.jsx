import React, { useState, useContext, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Alert,
  MenuItem,
} from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "../helpers/firebase";
import { useParams } from "react-router-dom";

const EditUserModal = ({ open, onClose, selectedUser }) => {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phone: "",
    role: "",
    active: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { schoolID } = useParams();
  const { currentUser } = useContext(AuthContext);
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

    fetchLocationIP(); // Call the function when component mounts
  }, []);

  useEffect(() => {
    if (selectedUser) {
      setFormData({
        email: selectedUser.email || "",
        fullName: selectedUser.fullName || "",
        phone: selectedUser.phone || "",
        role: selectedUser.role || "",
        active: selectedUser.active || "",
      });
    }
  }, [selectedUser]);

  const handleTextFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSelectFieldChange = (e) => {
    const { name, value } = e.target;
    if (name === "active") {
      setFormData((prevData) => ({ ...prevData, active: value === "Active" }));
    } else {
      setFormData((prevData) => ({ ...prevData, [name]: value }));
    }
  };

  const handleCloseAlert = () => {
    setSuccessMessage("");
    setErrorMessage("");
  };

  const handleEditUser = async () => {
    try {
      // Construct the reference to the house document
      const userDocRef = doc(db, "admin", selectedUser.id);
      // Update the document with the new form data
      await updateDoc(userDocRef, formData);
      console.log("Update done");
      setSuccessMessage("User updated successfully!");
      setErrorMessage("");
      // Add log entry to database
      const logsCollection = collection(db, "logs");
      await addDoc(logsCollection, {
        action: "User Edited",
        actionDate: new Date(),
        adminID: currentUser.email,
        locationIP: locationIP || "", // Use the current state of locationIP
        platform: "web",
        schoolID: schoolID,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      setSuccessMessage("");
      setErrorMessage("Error updating user: " + error.message);
    }
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit New User</DialogTitle>
      <DialogContent>
        <TextField
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleTextFieldChange}
          fullWidth
          margin="normal"
          disabled
        />

        <TextField
          label="Full Name"
          name="fullName"
          value={formData.fullName}
          onChange={handleTextFieldChange}
          fullWidth
          margin="normal"
          disabled
        />

        <TextField
          label="Phone"
          name="phone"
          value={formData.phone}
          onChange={handleTextFieldChange}
          fullWidth
          margin="normal"
          disabled
        />

        <TextField
          label="Role"
          name="role"
          select
          value={formData.role}
          onChange={handleSelectFieldChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        >
          {["Admin", "Super"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="active"
          name="active"
          select
          value={formData.active === true ? "Active" : "Inactive"}
          onChange={handleSelectFieldChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        >
          {["Active", "Inactive"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          color="primary"
          onClick={handleEditUser}
          size="small"
          sx={{ marginBottom: "1em" }}
        >
          Edit
        </Button>
        {successMessage && (
          <Alert severity="success" onClose={handleCloseAlert}>
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" onClose={handleCloseAlert}>
            {errorMessage}
          </Alert>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;

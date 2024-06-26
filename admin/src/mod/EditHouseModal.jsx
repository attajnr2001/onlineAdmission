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
} from "@mui/material";import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component

import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db, auth } from "../helpers/firebase";
import { useParams } from "react-router-dom";
import { useLocationIP, getPlatform } from "../helpers/utils";


const EditHouseModal = ({ open, onClose, rowData }) => {
  const [formData, setFormData] = useState({
    name: "",
    priority: "",
    noOfStudent: "",
    gender: "",
    bedCapacity: "",
  });

  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [loading, setLoading] = useState(false);
  const { schoolID } = useParams();
  const locationIP = useLocationIP();

 
  useEffect(() => {
    if (rowData) {
      setFormData({
        name: rowData.name || "",
        priority: rowData.priority || "",
        noOfStudent: rowData.noOfStudent || "",
        gender: rowData.gender || "",
        bedCapacity: rowData.bedCapacity || "",
      });
    }
  }, [rowData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleEditHouse = async () => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      const houseDocRef = doc(db, "houses", rowData.id);
      await updateDoc(houseDocRef, formData);

      const response = await fetch(
        "http://worldtimeapi.org/api/timezone/Africa/Accra"
      );
      const data = await response.json();
      const dateTimeString = data.datetime;
  
      // Log the addition of a new user
      const logsCollection = collection(db, "logs");
      await addDoc(logsCollection, {
        action: `${rowData.name} is updated`,
        actionDate: dateTimeString,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
        schoolID: schoolID,
      });

      console.log("Update done");
      setSnackbarMessage("House updated successfully!");
      setSnackbarSeverity("success");
    } catch (error) {
      console.error("Error updating house:", error);
      setSnackbarMessage("Error updating house: " + error.message);
      setSnackbarSeverity("error");
    }
    setLoading(false);

    onClose();
  };

  const handleCloseSnackbar = () => {
    setSnackbarMessage("");
  };

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Edit House</DialogTitle>
        <DialogContent>
          <TextField
            label="House Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            type="number"
            fullWidth
            margin="normal"
          />
          <TextField
            label="Number of Students"
            name="noOfStudent"
            type="number"
            value={formData.noOfStudent}
            onChange={handleChange}
            fullWidth
            disabled
            margin="normal"
            helperText="This is an automatic update value"
          />
          <TextField
            label="Gender"
            name="gender"
            select
            value={formData.gender}
            onChange={handleChange}
            fullWidth
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
          >
            {["MALE", "FEMALE"].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Bed Capacity"
            name="bedCapacity"
            type="number"
            value={formData.bedCapacity}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleEditHouse}
            size="small"
            sx={{ marginBottom: "1em" }}
            disabled={loading}
          >
            {loading ? "Updating..." : "Update"}
          </Button>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={Boolean(snackbarMessage)}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <NetworkStatusWarning />

    </>
  );
};

export default EditHouseModal;

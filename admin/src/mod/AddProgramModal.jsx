import React, { useState, useEffect } from "react";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component

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
import { useParams } from "react-router-dom";
import { useLocationIP, getPlatform } from "../helpers/utils";

const AddProgramModal = ({ open, onClose, onAddProgram }) => {
  const { schoolID } = useParams();

  const [formData, setFormData] = useState({
    programID: "",
    name: "",
    shortname: "",
    noOfStudents: "0",
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const locationIP = useLocationIP();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddProgram = async () => {
    const { programID, name, shortname, noOfStudents } = formData;

    // Check if any field is empty
    if (!programID || !name || !shortname || !noOfStudents) {
      setSnackbarMessage("All fields are required.");
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      const currentUser = auth.currentUser;

      // Check if program with the same ID or name already exists
      const programsRef = collection(db, "programs");
      const q = query(
        programsRef,
        where("schoolID", "==", schoolID),
        where("programID", "==", programID)
      );
      const q2 = query(
        programsRef,
        where("schoolID", "==", schoolID),
        where("name", "==", name)
      );

      const [programIDSnapshot, nameSnapshot] = await Promise.all([
        getDocs(q),
        getDocs(q2),
      ]);

      if (!programIDSnapshot.empty || !nameSnapshot.empty) {
        setSnackbarMessage("Program with the same ID or name already exists.");
        setSnackbarOpen(true);
        return;
      }

      // Add program data to Firestore collection
      const docRef = await addDoc(collection(db, "programs"), {
        schoolID: schoolID,
        programID: programID,
        name: name,
        shortname: shortname,
        noOfStudents: parseInt(noOfStudents),
      });
      console.log("Program added with ID: ", docRef.id);

      const response = await fetch(
        "http://worldtimeapi.org/api/timezone/Africa/Accra"
      );
      const data = await response.json();
      const dateTimeString = data.datetime;
      const dateTimeParts = dateTimeString.split(/[+\-]/);
      const dateTime = new Date(`${dateTimeParts[0]} UTC${dateTimeParts[1]}`);
      // Subtract one hour from the datetime
      dateTime.setHours(dateTime.getHours() - 1);

      // Log the addition of a new house
      const logsCollection = collection(db, "logs");
      await addDoc(logsCollection, {
        action: `Added new Program: ${formData.name}`,
        actionDate: dateTime,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
        schoolID: schoolID,
      });

      // Call the onAddProgram function with the form data
      onAddProgram(formData);

      // Clear the form data
      setFormData({
        programID: "",
        name: "",
        shortname: "",
        noOfStudents: "0",
      });

      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error adding program: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Program</DialogTitle>
      <DialogContent>
        <TextField
          label="Program ID"
          name="programID"
          value={formData.programID}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Program Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          select
          fullWidth
          margin="normal"
          required
        >
          {[
            "General Science",
            "General Arts",
            "Business",
            "Technical",
            "Home Economics",
            "Visual Arts",
          ].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Short Name"
          name="shortname"
          value={formData.shortname}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          type="number"
          label="Number of Students"
          name="noOfStudents"
          value={formData.noOfStudents}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <Button
          disabled={loading}
          variant="contained"
          color="primary"
          onClick={handleAddProgram}
        >
          {loading ? "Adding..." : "Add"}
        </Button>
      </DialogContent>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <NetworkStatusWarning />
    </Dialog>
  );
};

export default AddProgramModal;

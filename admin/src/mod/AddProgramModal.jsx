import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import { db } from "../helpers/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { useParams } from "react-router-dom";

const AddProgramModal = ({ open, onClose, onAddProgram }) => {
  const { schoolID } = useParams();

  const [formData, setFormData] = useState({
    programID: "",
    name: "",
    shortname: "",
    noOfStudents: "",
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAddProgram = async () => {
    try {
      // Check if program with the same ID or name already exists
      const programsRef = collection(db, "programs");
      const q = query(
        programsRef,
        where("schoolID", "==", schoolID),
        where("programID", "==", formData.programID)
      );
      const q2 = query(
        programsRef,
        where("schoolID", "==", schoolID),
        where("name", "==", formData.name)
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
        programID: formData.programID,
        shortname: formData.shortname,
        noOfStudents: parseInt(formData.noOfStudents),
        name: formData.name,
      });
      console.log("Program added with ID: ", docRef.id);
      // Call the onAddProgram function with the form data
      onAddProgram(formData);
      // Clear the form data
      setFormData({
        programID: "",
        name: "",
        shortname: "",
        noOfStudents: "",
      });
      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error adding program: ", error);
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
        />
        <TextField
          label="Program Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Short Name"
          name="shortname"
          value={formData.shortname}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          type="number"
          label="Number of Students"
          name="noOfStudents"
          value={formData.noOfStudents}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <Button variant="contained" color="primary" onClick={handleAddProgram}>
          Add
        </Button>
      </DialogContent>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="error"
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default AddProgramModal;

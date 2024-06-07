import React, { useState } from "react";
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
import { db } from "../helpers/firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  query,
  where,
} from "firebase/firestore";
import { useParams } from "react-router-dom";

const AddHouseModal = ({ open, onClose, onAddHouse }) => {
  const { schoolID } = useParams();

  const [formData, setFormData] = useState({
    name: "",
    priority: "",
    noOfStudent: "",
    gender: "",
    bedCapacity: "",
  });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  const handleAddHouse = async () => {
    try {
      // Check if a house with the same name already exists
      const querySnapshot = await getDocs(
        query(
          collection(db, "houses"),
          where("name", "==", formData.name),
          where("schoolID", "==", schoolID)
        )
      );
      const existingHouse = querySnapshot.docs[0];
      if (existingHouse) {
        setError(`A house with the name ${formData.name} already exists.`);
        return;
      }
      // Add house data to Firestore collection
      const docRef = await addDoc(collection(db, "houses"), {
        schoolID: schoolID,
        name: formData.name,
        priority: parseInt(formData.priority),
        noOfStudent: parseInt(formData.noOfStudent),
        gender: formData.gender,
        bedCapacity: parseInt(formData.bedCapacity),
      });
      console.log("House added with ID: ", docRef.id);
      // Call the onAddHouse function with the form data
      onAddHouse(formData);
      // Clear the form data
      setFormData({
        name: "",
        priority: "",
        noOfStudent: "",
        gender: "",
        bedCapacity: "",
      });
      // Close the modal
      onClose();
    } catch (error) {
      setError(`Error adding house: ${error.message}`);
    }
  };

  const handleCloseSnackbar = () => {
    setError(null);
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New House</DialogTitle>
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
          margin="normal"
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
          {["Male", "Female"].map((option) => (
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
          onClick={handleAddHouse}
          size="small"
        >
          Add
        </Button>
      </DialogContent>
      {error && (
        <Snackbar
          open={Boolean(error)}
          autoHideDuration={6000}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="error" onClose={handleCloseSnackbar}>
            {error}
          </Alert>
        </Snackbar>
      )}
    </Dialog>
  );
};

export default AddHouseModal;

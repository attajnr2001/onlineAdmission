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
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../helpers/firebase";

const EditHouseModal = ({ open, onClose, rowData }) => {
  const [formData, setFormData] = useState({
    name: "",
    priority: "",
    noOfStudent: "",
    gender: "",
    bedCapacity: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      const houseDocRef = doc(db, "houses", rowData.id);
      await updateDoc(houseDocRef, formData);
      console.log("Update done");
      setSuccessMessage("House updated successfully!");
      setErrorMessage("");
    } catch (error) {
      console.error("Error updating house:", error);
      setSuccessMessage("");
      setErrorMessage("Error updating house: " + error.message);
    }
    setLoading(false);

    setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage("");
    setErrorMessage("");
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
        open={Boolean(successMessage) || Boolean(errorMessage)}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        {successMessage ? (
          <Alert
            onClose={handleCloseSnackbar}
            severity="success"
            sx={{ width: "100%" }}
          >
            {successMessage}
          </Alert>
        ) : (
          <Alert
            onClose={handleCloseSnackbar}
            severity="error"
            sx={{ width: "100%" }}
          >
            {errorMessage}
          </Alert>
        )}
      </Snackbar>
    </>
  );
};

export default EditHouseModal;

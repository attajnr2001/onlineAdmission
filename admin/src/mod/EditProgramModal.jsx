import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Alert,
  Snackbar,
} from "@mui/material";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../helpers/firebase";

const EditProgramModal = ({ open, onClose, program }) => {
  const [formData, setFormData] = useState({
    programID: "",
    name: "",
    shortname: "",
    noOfStudents: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (program) {
      setFormData({
        programID: program.programID || "",
        name: program.name || "",
        shortname: program.shortname || "",
        noOfStudents: program.noOfStudents || "",
      });
    }
  }, [program]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleEditProgram = async () => {
    setLoading(true);
    try {
      // Construct the reference to the house document
      const programDocRef = doc(db, "programs", program.id);
      // Update the document with the new form data
      await updateDoc(programDocRef, formData);
      console.log("Update done");
      setSuccessMessage("Program updated successfully!");
      setErrorMessage("");
    } catch (error) {
      console.error("Error updating program:", error);
      setSuccessMessage("");
      setErrorMessage("Error updating program: " + error.message);
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
        <DialogTitle>Edit Program</DialogTitle>
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
            disabled
            margin="normal"
            helperText="This is an automatic updated value"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleEditProgram}
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

export default EditProgramModal;

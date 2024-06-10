import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Alert,
  Snackbar,
  MenuItem,
} from "@mui/material";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db, auth } from "../helpers/firebase";
import { useParams } from "react-router-dom";
import { useLocationIP, getPlatform } from "../helpers/utils";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component

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
  const { schoolID } = useParams();
  const locationIP = useLocationIP();

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
      const currentUser = auth.currentUser;
      // Construct the reference to the house document
      const programDocRef = doc(db, "programs", program.id);
      // Update the document with the new form data
      await updateDoc(programDocRef, formData);

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
        action: `${formData.name} is updated`,
        actionDate: dateTime,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
        schoolID: schoolID,
      });
      console.log("Update done");
      setSuccessMessage("Program updated successfully!");
      setErrorMessage("");
    } catch (error) {
      console.error("Error updating program:", error);
      setSuccessMessage("");
      setErrorMessage("Error updating program: " + error.message);
    }
    setLoading(false);

    onClose();
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
            select
            fullWidth
            margin="normal"
          >
            {[
              "General Arts",
              "General Science",
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
      <NetworkStatusWarning />

    </>
  );
};

export default EditProgramModal;

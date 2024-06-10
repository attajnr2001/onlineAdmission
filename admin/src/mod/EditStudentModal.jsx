import React, { useState, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  IconButton,
  Box,
  CircularProgress,
  Snackbar,
} from "@mui/material";
import { db, storage, auth } from "../helpers/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
  query,
  collection,
  addDoc,
  where,
} from "firebase/firestore";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component

import { Camera } from "@mui/icons-material";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useParams } from "react-router-dom";
import { useLocationIP, getPlatform } from "../helpers/utils";

const EditStudentModal = ({ houses, programs, open, onClose, student }) => {
  const [file, setFile] = useState("");
  const [formData, setFormData] = useState({
    indexNumber: "",
    house: "",
    firstName: "",
    lastName: "",
    program: "",
    year: "",
    status: "",
    image: "",
  });
  const [perc, setPerc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success"); // Add state for alert severity
  const [admissionData, setAdmissionData] = useState({});
  const [isSaving, setIsSaving] = useState(false); // Add state to manage save button disable state
  const { schoolID } = useParams();
  const locationIP = useLocationIP();

  useEffect(() => {
    const unsubscribeAdmission = onSnapshot(
      query(collection(db, "admission"), where("schoolID", "==", schoolID)),
      (snapshot) => {
        const admissionDoc = snapshot.docs[0];
        setAdmissionData(admissionDoc.data());
      },
      (error) => {
        console.error("Error fetching admission data:", error);
      }
    );
    return () => {
      unsubscribeAdmission();
    };
  }, [schoolID]);

  useEffect(() => {
    // Function to fetch student details and populate the form fields
    const fetchStudentDetails = async () => {
      if (student) {
        try {
          const studentDoc = await getDoc(doc(db, "students", student.id));
          if (studentDoc.exists()) {
            const studentData = studentDoc.data();
            // Populate the form fields with student data
            setFormData({
              indexNumber: studentData.indexNumber,
              house: studentData.house,
              firstName: studentData.firstName,
              lastName: studentData.lastName,
              program: studentData.program,
              year: studentData.year,
              status: studentData.status,
              image: studentData.image || "", // Set image field if available
            });
          }
        } catch (error) {
          console.error("Error fetching student details:", error);
        }
      }
    };

    fetchStudentDetails(); // Call the function to fetch student details
  }, [student]);

  useEffect(() => {
    const uploadFile = () => {
      const name = new Date().getTime() + file.name;
      const storageRef = ref(storage, name);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
          setPerc(progress);
          setUploading(true); // Set uploading status to true
          switch (snapshot.state) {
            case "paused":
              console.log("Upload is paused");
              break;
            case "running":
              console.log("Upload is running");
              break;
            default:
              break;
          }
        },
        (error) => {
          console.log(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setFormData((prev) => ({ ...prev, image: downloadURL })); // Update image URL in formData
            setUploading(false); // Set uploading status to false after upload
          });
        }
      );
    };
    file && uploadFile();
  }, [file]);

  const handleSave = async () => {
    setIsSaving(true); // Disable the save button
    try {
      const currentUser = auth.currentUser;

      await updateDoc(doc(db, "students", student.id), {
        indexNumber: formData.indexNumber,
        house: formData.house,
        firstName: formData.firstName,
        lastName: formData.lastName,
        program: formData.program,
        year: formData.year,
        status: formData.status,
        image: formData.image, // Update image URL in Firestore
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

      // Log the addition of a new house
      const logsCollection = collection(db, "logs");
      await addDoc(logsCollection, {
        action: `Student Details updated: ${formData.indexNumber}`,
        actionDate: dateTime,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
        schoolID: schoolID,
      });

      setAlertSeverity("success");
      setIsSaving(false);
      onClose();
    } catch (error) {
      console.error("Error updating student:", error);
      setAlertMessage("Error updating student. Please try again."); // Set error message for alert
      setAlertSeverity("error"); // Set alert severity to error
      setIsSaving(false); // Enable the save button
    }
  };

  const handleAlertClose = () => {
    setAlertMessage(""); // Clear alert message
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Student</DialogTitle>
      <DialogContent>
        {admissionData.allowUploadPictures ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar
              sx={{ width: "100px", height: "100px", marginBottom: "10px" }}
              src={formData.image || ""}
              alt="Student Image"
            />

            <input
              accept="image/*"
              id="icon-button-file"
              type="file"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files[0])}
            />
            <label htmlFor="icon-button-file">
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
              >
                <Camera />
              </IconButton>
            </label>
          </Box>
        ) : (
          <Box></Box>
        )}
        <TextField
          label="Index Number"
          name="indexNumber"
          fullWidth
          margin="normal"
          value={formData.indexNumber} // Populate value from state
          onChange={(e) =>
            setFormData({ ...formData, indexNumber: e.target.value })
          }
        />
        <TextField
          select
          label="House"
          name="house"
          fullWidth
          margin="normal"
          value={formData.house} // Populate value from state
          onChange={(e) => setFormData({ ...formData, house: e.target.value })}
        >
          {Object.keys(houses).map((houseId) => (
            <MenuItem key={houseId} value={houseId}>
              {houses[houseId]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="First Name"
          name="firstName"
          fullWidth
          margin="normal"
          value={formData.firstName} // Populate value from state
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
        />
        <TextField
          label="Last Name"
          name="lastName"
          fullWidth
          margin="normal"
          value={formData.lastName} // Populate value from state
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
        />
        <TextField
          select
          label="Program"
          name="program"
          fullWidth
          margin="normal"
          value={formData.program} // Populate value from state
          onChange={(e) =>
            setFormData({ ...formData, program: e.target.value })
          }
        >
          {Object.keys(programs).map((programId) => (
            <MenuItem key={programId} value={programId}>
              {programs[programId]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Year"
          name="year"
          type="number"
          fullWidth
          margin="normal"
          value={formData.year} // Populate value from state
          onChange={(e) => setFormData({ ...formData, year: e.target.value })}
        />
        <TextField
          select
          label="Status"
          name="status"
          fullWidth
          margin="normal"
          value={formData.status} // Populate value from state
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <MenuItem value="boarding">Boarding</MenuItem>
          <MenuItem value="day">Day</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || uploading}
        >
          {isSaving || uploading ? "Saving" : "Save"}
        </Button>
      </DialogActions>
      <Snackbar
        open={!!alertMessage}
        autoHideDuration={6000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        message={alertMessage}
      />
      <NetworkStatusWarning />
    </Dialog>
  );
};

export default EditStudentModal;

import React, { useState, useEffect, useContext } from "react";
import { TextField, Button, Snackbar, Alert } from "@mui/material";
import {
  doc,
  updateDoc,
  onSnapshot,
  collection,
  addDoc,
} from "firebase/firestore";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component
import { db } from "../helpers/firebase";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useLocationIP, getPlatform } from "../helpers/utils";

const EditSchoolDetails = () => {
  const { schoolID } = useParams();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [headMasterName, setHeadMasterName] = useState("");
  const [helpDeskNo, setHelpDeskNo] = useState("");
  const [box, setBox] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const locationIP = useLocationIP();
  const { currentUser } = useContext(AuthContext);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    const fetchSchoolData = () => {
      try {
        const schoolDocRef = doc(db, "school", schoolID);
        const unsubscribe = onSnapshot(schoolDocRef, (doc) => {
          if (doc.exists()) {
            const schoolData = doc.data();
            setName(schoolData.name || "");
            setAddress(schoolData.address || "");
            setPhone(schoolData.phone || "");
            setEmail(schoolData.email || "");
            setHeadMasterName(schoolData.headMasterName || "");
            setHelpDeskNo(schoolData.helpDeskNo || "");
            setBox(schoolData.box || ""); // Fetch POBox from the document
          } else {
            console.log("School document not found");
          }
        });

        return () => {
          unsubscribe(); // Unsubscribe when component unmounts
        };
      } catch (error) {
        console.error("Error fetching school details:", error);
      }
    };
    fetchSchoolData();
  }, [schoolID]);

  const handleSubmit = async () => {
    if (isUpdating) return;

    setIsUpdating(true);

    try {
      const schoolDocRef = doc(db, "school", schoolID);
      await updateDoc(schoolDocRef, {
        name,
        address,
        phone,
        email,
        headMasterName,
        helpDeskNo,
        box,
      });

      // Fetch current datetime from World Time API
      const response = await fetch(
        "http://worldtimeapi.org/api/timezone/Africa/Accra"
      );
      const data = await response.json();
      const dateTimeString = data.datetime;
   
      // Add log entry to database
      const logsCollection = collection(db, "logs");
      await addDoc(logsCollection, {
        action: `Updated school details for ${name}.`,
        actionDate: dateTimeString,
        schoolID: schoolID,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
      });

      setSnackbarMessage("School details updated successfully!");
      setSnackbarSeverity("success");
    } catch (error) {
      console.error("Error updating school details:", error);
      setSnackbarMessage("Error updating school details: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsUpdating(false);
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <h4>School Details</h4>
      <div>
        <TextField
          label="Name of School"
          type="text"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="Address"
          type="text"
          fullWidth
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="Phone"
          type="text"
          fullWidth
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="Email"
          type="text"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="Head Master Name"
          type="text"
          fullWidth
          value={headMasterName}
          onChange={(e) => setHeadMasterName(e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="Help desk No."
          type="text"
          fullWidth
          value={helpDeskNo}
          onChange={(e) => setHelpDeskNo(e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="P. O. Box"
          type="text"
          fullWidth
          value={box}
          onChange={(e) => setBox(e.target.value)}
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          sx={{ marginBottom: "1em" }}
          disabled={isUpdating}
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      </div>
      <Snackbar
        open={snackbarOpen}
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
      <NetworkStatusWarning/>
    </>
  );
};

export default EditSchoolDetails;

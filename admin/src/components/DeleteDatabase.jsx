// src/components/DeleteDatabase.js
import React, { useState } from "react";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
} from "@mui/material";
import { db, auth } from "../helpers/firebase";
import { collection, addDoc } from "firebase/firestore";
import { useParams } from "react-router-dom";
import { useLocationIP, getPlatform } from "../helpers/utils";

const DeleteDatabase = () => {
  const [open, setOpen] = useState(false);
  const locationIP = useLocationIP();
  const { schoolID } = useParams();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleDelete = async () => {
    try {
      const currentUser = auth.currentUser;

      console.log("Deleting entire database...");

      // Fetch current datetime from World Time API
      const response = await fetch(
        "http://worldtimeapi.org/api/timezone/Africa/Accra"
      );
      const data = await response.json();
      const dateTimeString = data.datetime;

      // Log the addition of a new house
      const logsCollection = collection(db, "logs");
      await addDoc(logsCollection, {
        action: `Database Deleted`,
        actionDate: dateTimeString,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
        schoolID: schoolID,
      });

      handleClose();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div
      style={{
        height: "55vh",
      }}
    >
      <Button
        variant="contained"
        color="error"
        onClick={handleOpen}
        sx={{ mb: 2 }}
      >
        Delete Entire Database
      </Button>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Alert severity="error">
            Are you sure you want to delete the entire database? This action
            cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      <NetworkStatusWarning />
    </div>
  );
};

export default DeleteDatabase;

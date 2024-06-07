import React, { useState, useEffect } from "react";
import { TextField, Button, Alert } from "@mui/material";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "../helpers/firebase";
import { useParams } from "react-router-dom";

const EditSchoolDetails = () => {
  const { schoolID } = useParams();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [headMasterName, setHeadMasterName] = useState("");
  const [helpDeskNo, setHelpDeskNo] = useState("");
  const [box, setBox] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
      setSuccessMessage("School details updated successfully!");
      setErrorMessage("");
    } catch (error) {
      console.error("Error updating school details:", error);
      setSuccessMessage("");
      setErrorMessage("Error updating school details: " + error.message);
    }
  };

  return (
    <>
      <p>School Details</p>
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
        >
          Confirm
        </Button>
        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
      </div>
    </>
  );
};

export default EditSchoolDetails;

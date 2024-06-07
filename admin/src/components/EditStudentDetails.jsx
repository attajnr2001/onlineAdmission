import React, { useState, useEffect } from "react";
import { TextField, Button, MenuItem, Alert } from "@mui/material";
import {
  collection,
  query,
  where,
  updateDoc,
  doc,
  onSnapshot, // Import onSnapshot
} from "firebase/firestore";
import { db } from "../helpers/firebase";
import { useParams } from "react-router-dom";

const EditStudentDetails = () => {
  const { schoolID } = useParams();
  const [studentData, setStudentData] = useState({
    showMedicalUndertaking: false,
    showProgramSubject: false,
    personalRecordsCaption: "",
    UndertakingMedicalCaption: "",
    programSubjectCaption: "",
    notes: "",
  });

  const [alertMessage, setAlertMessage] = useState(null);
  const [alertSeverity, setAlertSeverity] = useState("success");

  useEffect(() => {
    const fetchStudentDetails = () => {
      try {
        const studentRef = collection(db, "student");
        const q = query(studentRef, where("schoolID", "==", schoolID));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          querySnapshot.forEach((doc) => {
            const studentData = { id: doc.id, ...doc.data() };
            setStudentData(studentData);
          });
        });

        return () => {
          unsubscribe(); // Unsubscribe when component unmounts
        };
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };

    fetchStudentDetails();
  }, [schoolID]);

  const handleSubmit = async () => {
    try {
      await updateDoc(doc(db, "student", studentData.id), {
        UndertakingMedicalCaption: studentData.UndertakingMedicalCaption,
        notes: studentData.notes,
        personalRecordsCaption: studentData.personalRecordsCaption,
        programSubjectCaption: studentData.programSubjectCaption,
        showMedicalUndertaking: studentData.showMedicalUndertaking,
        showProgramSubject: studentData.showProgramSubject,
      });
      console.log("Document successfully updated!");
      setAlertMessage("Document successfully updated!");
      setAlertSeverity("success");
    } catch (error) {
      console.error("Error updating document:", error);
      setAlertMessage("Error updating document");
      setAlertSeverity("error");
    }
  };

  const handleTextFieldChange = (fieldName, value) => {
    setStudentData((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));
  };

  const handleSelectChange = (fieldName, value) => {
    setStudentData((prevData) => ({
      ...prevData,
      [fieldName]: value === "Yes" ? true : false,
    }));
  };

  return (
    <>
      <p>Student Details</p>
      <div>
        <TextField
          label="Show Undertaking/Medical Forms"
          select
          fullWidth
          value={studentData.showMedicalUndertaking ? "Yes" : "No"}
          onChange={(e) =>
            handleSelectChange("showMedicalUndertaking", e.target.value)
          }
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        >
          {["Yes", "No"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Show Program/Subject Combination"
          select
          fullWidth
          value={studentData.showProgramSubject ? "Yes" : "No"}
          onChange={(e) =>
            handleSelectChange("showProgramSubject", e.target.value)
          }
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        >
          {["Yes", "No"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Caption for Personal Records Form"
          type="text"
          fullWidth
          value={studentData.personalRecordsCaption}
          onChange={(e) =>
            handleTextFieldChange("personalRecordsCaption", e.target.value)
          }
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="Caption for Undertaking/Medical Form"
          type="text"
          fullWidth
          value={studentData.UndertakingMedicalCaption}
          onChange={(e) =>
            handleTextFieldChange("UndertakingMedicalCaption", e.target.value)
          }
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="Caption for Program/Subject Combination"
          type="text"
          fullWidth
          value={studentData.programSubjectCaption}
          onChange={(e) =>
            handleTextFieldChange("programSubjectCaption", e.target.value)
          }
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="Notes"
          multiline
          rows={4}
          fullWidth
          value={studentData.notes}
          onChange={(e) => handleTextFieldChange("notes", e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          sx={{ marginBottom: "1em" }}
        >
          Confirm
        </Button>

        {alertMessage && (
          <Alert severity={alertSeverity} onClose={() => setAlertMessage(null)}>
            {alertMessage}
          </Alert>
        )}
      </div>
    </>
  );
};

export default EditStudentDetails;

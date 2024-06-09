import React, { useState, useEffect, useContext } from "react";
import { TextField, Button, MenuItem, Alert, Snackbar } from "@mui/material";
import {
  collection,
  query,
  addDoc,
  where,
  updateDoc,
  doc,
  onSnapshot, // Import onSnapshot
} from "firebase/firestore";
import { db } from "../helpers/firebase";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useLocationIP, getPlatform } from "../helpers/utils";

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

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const locationIP = useLocationIP();
  const { currentUser } = useContext(AuthContext);
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
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      await updateDoc(doc(db, "student", studentData.id), {
        UndertakingMedicalCaption: studentData.UndertakingMedicalCaption,
        notes: studentData.notes,
        personalRecordsCaption: studentData.personalRecordsCaption,
        programSubjectCaption: studentData.programSubjectCaption,
        showMedicalUndertaking: studentData.showMedicalUndertaking,
        showProgramSubject: studentData.showProgramSubject,
      });

      const response = await fetch(
        "http://worldtimeapi.org/api/timezone/Africa/Accra"
      );
      const data = await response.json();
      const dateTimeString = data.datetime;
      const dateTimeParts = dateTimeString.split(/[+\-]/);
      const dateTime = new Date(`${dateTimeParts[0]} UTC${dateTimeParts[1]}`);
      // Subtract one hour from the datetime
      dateTime.setHours(dateTime.getHours() - 1);

      const logsCollection = collection(db, "logs");
      await addDoc(logsCollection, {
        action: `Admission Details updated Successfully`,
        actionDate: dateTime,
        schoolID: schoolID,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
      });

      console.log("Document successfully updated!");
      setAlertMessage("Document successfully updated!");
      setAlertSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error updating document:", error);
      setAlertMessage("Error updating document");
      setAlertSeverity("error");
    } finally {
      setIsUpdating(false);
      setSnackbarOpen(true);
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
          disabled={isUpdating}
          sx={{ marginBottom: "1em" }}
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity={alertSeverity}
          >
            {alertMessage}
          </Alert>
        </Snackbar>
      </div>
    </>
  );
};

export default EditStudentDetails;

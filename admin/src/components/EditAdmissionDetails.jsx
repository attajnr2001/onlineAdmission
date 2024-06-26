import React, { useState, useEffect, useContext } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Alert,
  Grid,
  Snackbar,
} from "@mui/material";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component
import {
  collection,
  query,
  addDoc,
  where,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../helpers/firebase";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useLocationIP, getPlatform } from "../helpers/utils";

const EditAdmissionDetails = () => {
  const { schoolID } = useParams();
  const [admissionData, setAdmissionData] = useState({
    senderID: "",
    year: "",
    reOpeningDateTime: null, // auto datetime time to determine admission opened or closed
    schOpeningDateTime: null, // the datetime sch reopens
    academicYear: "",
    acceptOnlinePayment: false,
    serviceCharge: "",
    allowUploadPictures: false,
    autoStudentHousing: false,
    allowStudentClassSelection: false,
    admissionStatus: false,
    announcement: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [reOpeningDate, setReOpeningDate] = useState("");
  const [reOpeningTime, setReOpeningTime] = useState("");
  const [schOpeningDate, setSchOpeningDate] = useState("");
  const [schOpeningTime, setSchOpeningTime] = useState("");
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertSeverity, setAlertSeverity] = useState("success");
  const [announcementTextFields, setAnnouncementTextFields] = useState([
    { value: "" },
  ]);
  const locationIP = useLocationIP();
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchAdmissionDetails = () => {
      try {
        const admissionRef = collection(db, "admission");
        const q = query(admissionRef, where("schoolID", "==", schoolID));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          querySnapshot.forEach((doc) => {
            const admissionData = { id: doc.id, ...doc.data() };
            setAdmissionData(admissionData);

            const date = new Date(
              admissionData.reOpeningDateTime.seconds * 1000
            );
            const schOpenDate = new Date(
              admissionData.schoolOpensOn.seconds * 1000
            );

            const formattedDate = date.toISOString().split("T")[0];
            const hours = ("0" + date.getHours()).slice(-2);
            const minutes = ("0" + date.getMinutes()).slice(-2);
            const formattedTime = `${hours}:${minutes}`;

            const schFormattedDate = schOpenDate.toISOString().split("T")[0];
            const schHours = ("0" + schOpenDate.getHours()).slice(-2);
            const schMinutes = ("0" + schOpenDate.getMinutes()).slice(-2);
            const schFormattedTime = `${schHours}:${schMinutes}`;

            setReOpeningDate(formattedDate);
            setReOpeningTime(formattedTime);
            setSchOpeningDate(schFormattedDate);
            setSchOpeningTime(schFormattedTime);
            setAnnouncementTextFields(
              admissionData.announcement.map((announcement) => ({
                value: announcement,
              }))
            );
          });
        });

        return () => {
          unsubscribe(); // Unsubscribe when component unmounts
        };
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };

    fetchAdmissionDetails();
  }, [schoolID]);

  const handleAddAnnouncement = () => {
    // Add new announcement logic here
    setAnnouncementTextFields((prevTextFields) => [
      ...prevTextFields,
      { value: "" },
    ]);
  };

  const handleRemoveAnnouncement = (index) => {
    setAnnouncementTextFields((prevTextFields) =>
      prevTextFields.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const schoolOpensOn = new Date(`${schOpeningDate}T${schOpeningTime}`);

      await updateDoc(doc(db, "admission", admissionData.id), {
        senderID: admissionData.senderID,
        year: admissionData.year,
        reOpeningDateTime: new Date(`${reOpeningDate}T${reOpeningTime}`),
        schoolOpensOn,
        academicYear: admissionData.academicYear,
        acceptOnlinePayment: admissionData.acceptOnlinePayment,
        serviceCharge: admissionData.serviceCharge,
        allowUploadPictures: admissionData.allowUploadPictures,
        autoStudentHousing: admissionData.autoStudentHousing,
        allowStudentClassSelection: admissionData.allowStudentClassSelection,
        admissionStatus: admissionData.admissionStatus,
        announcement: announcementTextFields.map(
          (textField) => textField.value
        ),
      });

      const response = await fetch(
        "http://worldtimeapi.org/api/timezone/Africa/Accra"
      );
      const data = await response.json();
      const dateTimeString = data.datetime;

      const logsCollection = collection(db, "logs");
      await addDoc(logsCollection, {
        action: `Admission Details updated Successfully`,
        actionDate: dateTimeString,
        schoolID: schoolID,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
      });

      setAlertMessage("Document successfully updated!");
      setAlertSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error(error);
      setAlertMessage("Error updating document");
      setAlertSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsUpdating(false);
      setSnackbarOpen(true);
    }
  };

  const handleTextFieldChange = (field, value) => {
    setAdmissionData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleAnnouncementChange = (index, value) => {
    setAnnouncementTextFields((prevTextFields) => {
      const newTextFields = [...prevTextFields];
      newTextFields[index].value = value;
      return newTextFields;
    });
  };

  const handleSelectChange = (fieldName, value) => {
    setAdmissionData((prevData) => ({
      ...prevData,
      [fieldName]: value === "Yes" ? true : false,
    }));
  };

  return (
    <>
      <h4>Admission Details</h4>

      <div>
        <TextField
          label="SHS Sender ID"
          type="text"
          fullWidth
          value={admissionData.senderID}
          onChange={(e) => handleTextFieldChange("senderID", e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="Admission Year"
          type="text"
          fullWidth
          value={admissionData.year}
          onChange={(e) => handleTextFieldChange("year", e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="Academic Year"
          type="text"
          fullWidth
          value={admissionData.academicYear}
          onChange={(e) =>
            handleTextFieldChange("academicYear", e.target.value)
          }
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="Accept Online Payment"
          select
          fullWidth
          value={admissionData.acceptOnlinePayment ? "Yes" : "No"}
          onChange={(e) =>
            handleSelectChange("acceptOnlinePayment", e.target.value)
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
          label="Service Charge"
          type="number"
          fullWidth
          value={admissionData.serviceCharge}
          onChange={(e) =>
            handleTextFieldChange("serviceCharge", e.target.value)
          }
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="Allow Upload of passport pictures"
          select
          fullWidth
          value={admissionData.allowUploadPictures ? "Yes" : "No"}
          onChange={(e) =>
            handleSelectChange("allowUploadPictures", e.target.value)
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
          label="Automatic Housing Selection"
          select
          fullWidth
          value={admissionData.autoStudentHousing ? "Yes" : "No"}
          onChange={(e) =>
            handleSelectChange("autoStudentHousing", e.target.value)
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
          label="Student Classroom Selection"
          select
          fullWidth
          value={admissionData.allowStudentClassSelection ? "Yes" : "No"}
          onChange={(e) =>
            handleSelectChange("allowStudentClassSelection", e.target.value)
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
          label="Auto Admission Open Date"
          type="date"
          fullWidth
          value={reOpeningDate}
          onChange={(e) => setReOpeningDate(e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="Auto Admission Open Time"
          type="time"
          fullWidth
          value={reOpeningTime}
          onChange={(e) => setReOpeningTime(e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="School Resopen Date"
          type="date"
          fullWidth
          value={schOpeningDate}
          onChange={(e) => setSchOpeningDate(e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="School Resopen Time"
          type="time"
          fullWidth
          value={schOpeningTime}
          onChange={(e) => setSchOpeningTime(e.target.value)}
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="Admission Opened"
          select
          fullWidth
          value={admissionData.admissionStatus ? "Yes" : "No"}
          onChange={(e) =>
            handleSelectChange("admissionStatus", e.target.value)
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

        <Grid
          container
          alignItems="center"
          style={{ marginTop: "1rem" }}
          spacing={1}
        >
          {announcementTextFields.map((textField, index) => (
            <React.Fragment key={index}>
              <Grid item xs={9}>
                <TextField
                  label="Announcement"
                  type="text"
                  fullWidth
                  value={textField.value}
                  onChange={(e) =>
                    handleAnnouncementChange(index, e.target.value)
                  }
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={1}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => handleRemoveAnnouncement(index)}
                  sx={{ mb: { xs: 2, md: 0 } }}
                >
                  -
                </Button>
              </Grid>
            </React.Fragment>
          ))}

          <Grid item xs={12} sm={1}>
            <Button
              sx={{ mb: { xs: 2, md: 0 } }}
              variant="contained"
              color="primary"
              onClick={() => handleAddAnnouncement()}
            >
              +
            </Button>
          </Grid>
        </Grid>

        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
          sx={{ marginBottom: "1em" }}
          disabled={isUpdating}
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
      <NetworkStatusWarning />
    </>
  );
};

export default EditAdmissionDetails;

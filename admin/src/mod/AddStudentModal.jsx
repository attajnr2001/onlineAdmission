import React, { useState, useEffect } from "react";
import { db, auth } from "../helpers/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  increment,
} from "firebase/firestore";
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
import { useParams } from "react-router-dom";

const AddStudentModal = ({ open, onClose }) => {
  const { schoolID } = useParams();
  const [programs, setPrograms] = useState({});
  const [indexNumber, setIndexNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState("");
  const [program, setProgram] = useState("");
  const [aggregate, setAggregate] = useState(0);
  const [jhsAttended, setJhsAttended] = useState("");
  const [dateOfbirth, setDateOfbirth] = useState("");
  const [smsContact, setSmsContact] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationIP, setLocationIP] = useState("");

  useEffect(() => {
    const fetchLocationIP = async () => {
      try {
        const response = await fetch("https://api64.ipify.org?format=json");
        const data = await response.json();
        setLocationIP(data.ip);
      } catch (error) {
        console.error("Error fetching location IP:", error);
      }
    };

    fetchLocationIP();
  }, []);

  const getPlatform = () => {
    const userAgent = navigator.userAgent;
    if (/Mobi|Android/i.test(userAgent)) {
      return "mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
      return "tablet";
    } else {
      return "desktop";
    }
  };
  useEffect(() => {
    const unsubscribePrograms = onSnapshot(
      query(collection(db, "programs"), where("schoolID", "==", schoolID)),
      (snapshot) => {
        const fetchedPrograms = {};
        snapshot.forEach((doc) => {
          fetchedPrograms[doc.id] = doc.data().name;
        });
        setPrograms(fetchedPrograms);
      },
      (error) => {
        console.error("Error  fetching programs:", error);
      }
    );
    return () => {
      unsubscribePrograms();
    };
  }, [schoolID]);

  const handleSubmit = async () => {
    try {
      if (
        !indexNumber ||
        !firstName ||
        !lastName ||
        !gender ||
        !status ||
        !program ||
        !aggregate ||
        !jhsAttended ||
        !dateOfbirth ||
        !smsContact
      ) {
        setAlertMessage("Please Fill all required fields");
        setSnackbarOpen(true);
        return;
      }

      setLoading(true);
      const currentUser = auth.currentUser;

      const studentQuery = query(
        collection(db, "students"),
        where("schoolID", "==", schoolID),
        where("indexNumber", "==", indexNumber)
      );
      const studentSnapshot = await getDocs(studentQuery);

      if (!studentSnapshot.empty) {
        setAlertMessage("Error:Student with this index number already exists.");
        setSnackbarOpen(true);
        setLoading(false);
        return;
      }

      const admissionRef = collection(db, "admission");
      const admissionQuery = query(
        admissionRef,
        where("schoolID", "==", schoolID)
      );
      const admissionSnapshot = await getDocs(admissionQuery);
      const year = admissionSnapshot.docs[0].data().year;

      const studentRef = collection(db, "students");
      const allStudentsQuery = query(
        studentRef,
        where("schoolID", "==", schoolID)
      );
      const allStudentsSnapshot = await getDocs(allStudentsQuery);
      const admissionNos = allStudentsSnapshot.docs.map(
        (doc) => doc.data().admissionNo
      );
      const maxAdmissionNo = Math.max(...admissionNos);
      const newAdmissionNo = maxAdmissionNo + 1;

      const newStudent = await addDoc(studentRef, {
        schoolID,
        indexNumber,
        firstName,
        lastName,
        gender,
        status,
        program,
        aggregate,
        jhsAttended,
        dateOfbirth,
        smsContact,
        year,
        admissionNo: newAdmissionNo,
        completed: false,
        hasPaid: false,
      });

      const programRef = doc(db, "programs", program);
      await updateDoc(programRef, {
        noOfStudents: increment(1),
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
        action: `Added new Student: ${indexNumber}`,
        actionDate: dateTime,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
        schoolID: schoolID,
      });
      console.log(`Student added with ID: ${newStudent.id}`);
      setAlertMessage(`Student added with ID: ${indexNumber}`);
      setSnackbarOpen(true);
      setLoading(false);
      onClose(); // Close the modal
    } catch (error) {
      setAlertMessage("Error adding student");
      setSnackbarOpen(true);
      setLoading(false);
      console.error("Error adding student:", error);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Add A Single Record</DialogTitle>
        <DialogContent>
          <TextField
            required
            label="Index Number"
            name="indexNumber"
            fullWidth
            margin="normal"
            value={indexNumber}
            onChange={(e) => setIndexNumber(e.target.value)}
          />
          <TextField
            required
            label="First Name"
            name="firstName"
            fullWidth
            margin="normal"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField
            required
            label="Last Name"
            name="lastName"
            fullWidth
            margin="normal"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
          <TextField
            required
            label="Gender"
            name="gender"
            select
            fullWidth
            margin="normal"
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            {["Male", "Female"].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            required
            label="Status"
            name="status"
            select
            fullWidth
            margin="normal"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {["day", "boarding"].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            required
            select
            label="Program"
            name="program"
            fullWidth
            margin="normal"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
          >
            {Object.keys(programs).map((programId) => (
              <MenuItem key={programId} value={programId}>
                {programs[programId]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            required
            label="Aggregate of best 6"
            name="aggregate"
            type="number"
            fullWidth
            margin="normal"
            value={aggregate}
            onChange={(e) => setAggregate(e.target.value)}
          />
          <TextField
            required
            label="JHS Attended"
            name="jhsAttended"
            fullWidth
            margin="normal"
            value={jhsAttended}
            onChange={(e) => setJhsAttended(e.target.value)}
          />
          <TextField
            required
            label="Date Of Birth"
            name="dateOfbirth"
            type="date"
            fullWidth
            margin="normal"
            value={dateOfbirth}
            onChange={(e) => setDateOfbirth(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            required
            label="SMS Contact"
            name="smsContact"
            type="number"
            fullWidth
            margin="normal"
            value={smsContact}
            onChange={(e) => setSmsContact(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Adding..." : "Add"}
          </Button>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={alertMessage.includes("Error ") ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddStudentModal;

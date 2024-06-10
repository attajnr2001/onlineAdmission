import React, { useState, useEffect } from "react";
import {
  Input,
  DialogTitle,
  DialogContent,
  Button,
  Dialog,
  DialogActions,
  Alert,
} from "@mui/material";
import * as XLSX from "xlsx";
import {
  collection,
  addDoc,
  query,
  where,
  doc,
  updateDoc,
  increment,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../helpers/firebase";
import { useLocationIP, getPlatform } from "../helpers/utils";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component

const ImportStudentExcel = ({ open, onClose, programs, schoolID }) => {
  const [excelFile, setExcelFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const locationIP = useLocationIP();

  const handleFileChange = (event) => {
    let fileTypes = [
      ".xlsx",
      ".xls",
      ".csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    const file = event.target.files[0];
    if (file) {
      if (
        fileTypes.includes(file.type) ||
        fileTypes.includes(file.name.split(".").pop())
      ) {
        setError(null);
        let reader = new FileReader();
        reader.readAsArrayBuffer(file);
        reader.onload = (e) => {
          setExcelFile(e.target.result);
        };
      } else {
        setError(<Alert severity="error">Only Excel Files are accepted</Alert>);
        setExcelFile(null);
      }
    } else {
      console.log("Please select your file");
    }
  };

  const handleUpload = async () => {
    if (excelFile !== null) {
      setLoading(true);
      const workbook = XLSX.read(excelFile, { type: "buffer" });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data) {
        const studentsToSave = data.map((student) => {
          const programId = Object.keys(programs).find(
            (id) => programs[id] === student["Program"]
          );

          return {
            aggregate: student["Aggregate of Best Six"],
            dateOfBirth: student["Date of Birth(dd/mm/yyyy)"],
            firstName: student["First Name"],
            gender: student["Gender"],
            jhsAttended: student["JHS Attended"] || "",
            indexNumber: student["JHS Index No"],
            lastName: student["Last Name"] || "",
            program: programId || null,
            smsContact: student["SMS Contact"],
            status: student["Status"],
            completed: false,
            hasPaid: false,
            schoolID: schoolID,
            createdAt: serverTimestamp(),
          };
        });

        await saveStudentsToDatabase(studentsToSave);
      }
    }
  };

  const saveStudentsToDatabase = async (students) => {
    try {
      const currentUser = auth.currentUser;
      const studentsCollection = collection(db, "students");

      // Fetch existing students with matching schoolID and indexNumber
      const indexNumbers = students.map((student) => student.indexNumber);
      const studentQuery = query(
        studentsCollection,
        where("schoolID", "==", schoolID),
        where("indexNumber", "in", indexNumbers)
      );
      const studentSnapshot = await getDocs(studentQuery);
      const existingIndexNumbers = new Set(
        studentSnapshot.docs.map((doc) => doc.data().indexNumber)
      );

      // Filter out students with duplicate index numbers
      const filteredStudents = students.filter(
        (student) => !existingIndexNumbers.has(student.indexNumber)
      );

      // Get the current year from the admission collection
      const admissionRef = collection(db, "admission");
      const admissionQuery = query(
        admissionRef,
        where("schoolID", "==", schoolID)
      );
      const admissionSnapshot = await getDocs(admissionQuery);
      const year = admissionSnapshot.docs[0]?.data().year;

      if (!year) {
        setError(<Alert severity="error">Error fetching admission year</Alert>);
        setLoading(false);
        return;
      }

      // Get the highest admission number and generate new admission numbers
      const studentAdmissionNosQuery = query(
        studentsCollection,
        where("schoolID", "==", schoolID)
      );
      const studentAdmissionNosSnapshot = await getDocs(
        studentAdmissionNosQuery
      );
      const admissionNos = studentAdmissionNosSnapshot.docs.map(
        (doc) => doc.data().admissionNo
      );
      const maxAdmissionNo = Math.max(...admissionNos);
      let newAdmissionNo = maxAdmissionNo + 1;

      // Add filtered students to the database
      const promises = filteredStudents.map((student) => {
        const studentWithAdmissionNo = {
          ...student,
          year,
          admissionNo: newAdmissionNo++,
        };
        return addDoc(studentsCollection, studentWithAdmissionNo);
      });

      await Promise.all(promises);

      // Update the program document with the number of new students added
      const programUpdatePromises = filteredStudents.map((student) => {
        if (student.program) {
          const programRef = doc(db, "programs", student.program);
          return updateDoc(programRef, { noOfStudents: increment(1) });
        }
        return Promise.resolve();
      });

      await Promise.all(programUpdatePromises);

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
        action: `Student List Imported Successfully`,
        actionDate: dateTime,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
        schoolID: schoolID,
      });

      setError(
        <Alert severity="success">
          Students successfully saved to database
        </Alert>
      );

      setLoading(false);
      onClose();
    } catch (error) {
      console.error("Error saving students to database:", error);
      setError(
        <Alert severity="error">Error saving students to database</Alert>
      );
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Import Student Excel</DialogTitle>
      <DialogContent>
        <a href={process.env.CSSPS_EXCEL_TEMPLATE} download>
          <Button variant="contained" size="small" color="primary">
            Download Template
          </Button>
        </a>

        <p>
          Please click the button above to download the template. Once
          downloaded, copy the CSSPS list into the template, and then upload the
          completed template.
        </p>
        <Input
          type="file"
          sx={{ margin: "1em 0" }}
          onChange={handleFileChange}
          accept=".xlsx, .xls, .csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
        />
        <p>
          You are only allowed to upload excel files, precisely the excel file
          from the template you have edited. Make sure the excel file is
          populated
        </p>
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={handleUpload}
          sx={{ margin: "1em 0" }}
          disabled={!excelFile || loading}
        >
          {loading ? "Uploading File" : "Upload File"}
        </Button>
        {error && <>{error}</>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
      </DialogActions>
      <NetworkStatusWarning />
    </Dialog>
  );
};

export default ImportStudentExcel;

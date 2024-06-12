import React, { useState } from "react";
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
    const allowedTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    const file = event.target.files[0];
    if (file) {
      if (allowedTypes.includes(file.type)) {
        setError(null);
        const reader = new FileReader();
        reader.onload = (e) => {
          setExcelFile(e.target.result);
        };
        reader.readAsArrayBuffer(file);
      } else {
        setError(<Alert severity="error">Only Excel Files are accepted</Alert>);
        setExcelFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (excelFile) {
      setLoading(true);
      try {
        const workbook = XLSX.read(excelFile, { type: "buffer" });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data) {
          const studentsToSave = data.map((student) => ({
            aggregate: student["Aggregate of Best Six"] || "",
            dateOfBirth: student["Date of Birth(dd/mm/yyyy)"] || "",
            firstName: student["Other Names"] || "",
            gender: student["Gender"]?.toUpperCase() || "",
            jhsAttended: student["JHS Attended"] || "",
            indexNumber: student["JHS Index No"],
            lastName: student["Last Name"] || "",
            program:
              Object.keys(programs).find(
                (id) =>
                  programs[id]?.toUpperCase() ===
                  student["Programme"]?.toUpperCase()
              ) || null,
            smsContact: student["SMS Contact"] || "",
            status: student["Boarding Status"]?.toUpperCase() || "",
            completed: false,
            hasPaid: false,
            schoolID: schoolID,
            createdAt: serverTimestamp(),
          }));

          await saveStudentsToDatabase(studentsToSave);
        }
      } catch (error) {
        console.error("Error processing file:", error);
        setError(<Alert severity="error">Error processing file</Alert>);
      }
      setLoading(false);
    }
  };

  const saveStudentsToDatabase = async (students) => {
    try {
      const currentUser = auth.currentUser;
      const studentsCollection = collection(db, "students");

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

      const filteredStudents = students.filter(
        (student) => !existingIndexNumbers.has(student.indexNumber)
      );

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
      const maxAdmissionNo = Math.max(...admissionNos, 0);
      let newAdmissionNo = maxAdmissionNo + 1;

      const promises = filteredStudents.map((student) => {
        const studentWithAdmissionNo = {
          ...student,
          year,
          admissionNo: newAdmissionNo++,
        };
        return addDoc(studentsCollection, studentWithAdmissionNo);
      });

      await Promise.all(promises);

      const programUpdatePromises = filteredStudents.map((student) => {
        if (student.program) {
          const programRef = doc(db, "programs", student.program);
          return updateDoc(programRef, { noOfStudents: increment(1) });
        }
        return Promise.resolve();
      });

      await Promise.all(programUpdatePromises);

      await addDoc(collection(db, "logs"), {
        action: `Student List Imported Successfully`,
        actionDate: serverTimestamp(),
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

      onClose();
    } catch (error) {
      console.error("Error saving students to database:", error);
      setError(
        <Alert severity="error">Error saving students to database</Alert>
      );
    } finally {
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

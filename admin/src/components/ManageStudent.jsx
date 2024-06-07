import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Paper,
  TextField,
  Avatar,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";
// import "../styles/docs.css";
import { db } from "../helpers/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useParams } from "react-router-dom";
import EditStudentModal from "../mod/EditStudentModal";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { visuallyHidden } from "@mui/utils";

const ManageStudent = () => {
  const { schoolID } = useParams();
  const [students, setStudents] = useState([]);
  const [houses, setHouses] = useState({});
  const [programs, setPrograms] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [admissionData, setAdmissionData] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("indexNumber");

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

  function stringAvatar(name) {
    return {
      children: `${name.split(" ")[0][0]}${name.split(" ")[1][0]}`,
    };
  }

  function capitalizeName(name) {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Function to handle edit button click
  const handleEditButtonClick = (student) => {
    console.log("Edit button clicked:", student);
    setSelectedStudent(student); // Set the selected student
    setIsEditModalOpen(true); // Open the modal
    console.log("Modal open state:", isEditModalOpen);
  };

  const handleCSVExport = () => {
    const csvData = Papa.unparse(
      filteredStudents.map((student) => ({
        IndexNumber: student.indexNumber,
        House: houses[student.house],
        StudentName: `${student.firstName} ${student.lastName}`,
        Program: programs[student.program],
        Year: student.year,
        Status: student.status,
      }))
    );
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "students.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExcelExport = () => {
    const workBook = XLSX.utils.book_new();
    const workSheet = XLSX.utils.json_to_sheet(
      filteredStudents.map((student) => ({
        IndexNumber: student.indexNumber,
        House: houses[student.house],
        StudentName: `${student.firstName} ${student.lastName}`,
        Program: programs[student.program],
        Year: student.year,
        Status: student.status,
      }))
    );
    XLSX.utils.book_append_sheet(workBook, workSheet, "Students");
    XLSX.writeFile(workBook, "students.xlsx");
  };

  const handlePDFExport = () => {
    const doc = new jsPDF();
    doc.text("Students List", 20, 10);
    doc.autoTable({
      head: [
        ["Index Number", "House", "Student Name", "Program", "Year", "Status"],
      ],
      body: filteredStudents.map((student) => [
        student.indexNumber,
        houses[student.house],
        `${student.firstName} ${student.lastName}`,
        programs[student.program],
        student.year,
        student.status,
      ]),
    });
    doc.save("students.pdf");
  };

  const handlePrint = () => {
    console.log("Printing...");
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  // Function to handle edit button click

  useEffect(() => {
    const unsubscribeStudents = onSnapshot(
      query(
        collection(db, "students"),
        where("schoolID", "==", schoolID),
        where("completed", "==", true)
      ),
      (snapshot) => {
        const fetchedStudents = [];
        snapshot.forEach((doc) => {
          fetchedStudents.push({ id: doc.id, ...doc.data() });
        });
        setStudents(fetchedStudents);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching students:", error);
        setError(error);
        setLoading(false);
      }
    );

    const unsubscribeHouses = onSnapshot(
      query(collection(db, "houses"), where("schoolID", "==", schoolID)),
      (snapshot) => {
        const fetchedHouses = {};
        snapshot.forEach((doc) => {
          fetchedHouses[doc.id] = doc.data().name;
        });
        setHouses(fetchedHouses);
      },
      (error) => {
        console.error("Error fetching houses:", error);
      }
    );

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
        console.error("Error fetching programs:", error);
      }
    );

    return () => {
      unsubscribeStudents();
      unsubscribeHouses();
      unsubscribePrograms();
    };
  }, [schoolID]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };
  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase());
  });

  const sortedStudents = stableSort(
    filteredStudents,
    getComparator(order, orderBy)
  );

  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const slicedStudents = filteredStudents.slice(startIndex, endIndex);

  if (loading) {
    return (
      <div className="loading-container">
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <Alert severity="error">{error.message}</Alert>
      </div>
    );
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(event.target.value);
    setPage(0); // reset page to 0 when rows per page changes
  };

  return (
    <div>
      <div className="top">
        <div className="buttons" style={{ marginBottom: "1rem" }}>
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={handleCSVExport}
          >
            CSV
          </Button>

          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={handleExcelExport}
          >
            Excel
          </Button>

          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={handlePDFExport}
          >
            PDF
          </Button>

          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={handlePrint}
          >
            Print
          </Button>
        </div>

        <TextField
          label="Search student by name"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <TableContainer
        component={Paper}
        sx={{ marginTop: "1em", whiteSpace: "nowrap" }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">Image</TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "indexNumber"}
                  direction={orderBy === "indexNumber" ? order : "asc"}
                  onClick={(event) => handleRequestSort(event, "indexNumber")}
                >
                  Index Number
                  {orderBy === "indexNumber" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>{" "}
              <TableCell align="center">House</TableCell>
              <TableCell align="center">Student Name</TableCell>
              <TableCell align="center">Program</TableCell>
              <TableCell align="center">Year</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slicedStudents.map((student, index) => (
              <TableRow key={index}>
                <TableCell align="center">
                  {admissionData.allowUploadPictures ? (
                    student.image ? (
                      <Avatar src={student.image} />
                    ) : (
                      <Avatar
                        {...stringAvatar(
                          `${capitalizeName(
                            student.firstName
                          )} ${capitalizeName(student.lastName)}`
                        )}
                      />
                    )
                  ) : (
                    <Avatar
                      {...stringAvatar(
                        `${capitalizeName(student.firstName)} ${capitalizeName(
                          student.lastName
                        )}`
                      )}
                    />
                  )}
                </TableCell>
                <TableCell align="center">{student.indexNumber}</TableCell>
                <TableCell align="center">{houses[student.house]}</TableCell>
                <TableCell align="center">
                  {capitalizeName(`${student.firstName} ${student.lastName}`)}
                </TableCell>
                <TableCell align="center">
                  {programs[student.program]}
                </TableCell>
                <TableCell align="center">{student.year}</TableCell>
                <TableCell align="center">{student.status}</TableCell>
                <TableCell align="center" className="actions">
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => handleEditButtonClick(student)} // Handle edit button click
                  >
                    Edit
                  </Button>
                  <Button variant="outlined" color="error" size="small">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={filteredStudents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <EditStudentModal
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        houses={houses}
        programs={programs}
        student={selectedStudent} // Pass the selected student data
      />
    </div>
  );
};

// Utility functions for sorting
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return typeof b[orderBy] === "string" ? 1 : -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return typeof b[orderBy] === "string" ? -1 : 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

export default ManageStudent;

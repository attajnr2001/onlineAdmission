import React, { useState, useEffect } from "react";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component
import {
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  TableSortLabel,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
} from "@mui/material";
import AddStudentModal from "../mod/AddStudentModal";
import ImportStudentExcel from "../mod/ImportStudentExcel";
import {
  collection,
  query,
  where,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  increment,
} from "firebase/firestore";
import { db, auth } from "../helpers/firebase";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { visuallyHidden } from "@mui/utils";
import { useLocationIP, getPlatform } from "../helpers/utils";

const PlacementActions = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openAddStudentModal, setOpenAddStudentModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState({});
  const { schoolID } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("indexNumber");
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const locationIP = useLocationIP();

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  useEffect(() => {
    const unsubscribeStudents = onSnapshot(
      query(collection(db, "students"), where("schoolID", "==", schoolID)),
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

    const unsubscribePrograms = onSnapshot(
      collection(db, "programs"),
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
      unsubscribePrograms();
    };
  }, [schoolID]);

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

  const handleImportButtonClick = () => {
    setOpenImportDialog(true);
  };

  const handlePDFExport = async () => {
    try {
      const currentUser = auth.currentUser;

      const doc = new jsPDF();
      doc.text("Students List", 20, 10);
      doc.autoTable({
        head: [
          [
            "Index Number",
            "Student Name",
            "JHS Attended",
            "Aggregate",
            "Program",
            "Year",
            "Status",
          ],
        ],
        body: filteredStudents.map((student) => [
          student.indexNumber,
          `${student.firstName} ${student.lastName}`,
          student.jhsAttended,
          student.aggregate,
          programs[student.program],
          student.year,
          student.status,
        ]),
      });

      doc.save("students.pdf");
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
        action: `Student List Downloaded`,
        actionDate: dateTime,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
        schoolID: schoolID,
      });
    } catch (error) {
      console.log("Error downloading list", error);
    }
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    return fullName.includes(searchQuery);
  }); 

  const sortedStudents = stableSort(
    filteredStudents,
    getComparator(order, orderBy)
  );

  const handleDeleteUnregisteredStudents = async () => {
    setOpenDialog(true);
  };

  const handleDialogClose = async (confirm) => {
    setOpenDialog(false);
    if (confirm) {
      try {
        const currentUser = auth.currentUser;

        const studentsRef = collection(db, "students");
        const q = query(
          studentsRef,
          where("schoolID", "==", schoolID),
          where("completed", "==", false)
        );
        const querySnapshot = await getDocs(q); // Get the QuerySnapshot
        querySnapshot.forEach((student) => {
          // Now you can use forEach
          const programId = student.data().program; // Also, use data() to get the document data
          const programRef = doc(db, "programs", programId);
          updateDoc(programRef, { noOfStudents: increment(-1) });
        });
        // Delete the students
        querySnapshot.forEach((doc) => {
          deleteDoc(doc.ref);
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
          action: `Unregistered Student List deleted`,
          actionDate: dateTime,
          adminID: currentUser.email,
          locationIP: locationIP || "",
          platform: getPlatform(),
          schoolID: schoolID,
        });

        console.log("Unregistered students deleted successfully!");
        // Show success snackbar
        setSnackbarMessage("Unregistered students deleted successfully!");
        setSnackbarOpen(true);
        setAlertSeverity("success");
      } catch (error) {
        console.error("Error deleting unregistered students:", error);
        // Show error snackbar
        setSnackbarMessage(
          "Error deleting unregistered students: " + error.message
        );
        setSnackbarOpen(true);
        setAlertSeverity("error"); // Should be "error" instead of "success"
      }
    }
  };

  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const currentPageData = sortedStudents.slice(startIndex, endIndex);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(event.target.value);
    setPage(0); // reset page to 0 when rows per page changes
  };

  return (
    <div>
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setOpenAddStudentModal(true)}
          >
            Add New Single Record
          </Button>
        </Grid>

        <Grid item>
          <Button
            variant="outlined"
            color="success"
            onClick={handleImportButtonClick}
          >
            Import from CSSPS Excel
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handlePDFExport}
          >
            Download Previously Imported List
          </Button>
        </Grid>
        <Grid item>
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteUnregisteredStudents}
          >
            Delete All Unregistered Placement
          </Button>
        </Grid>
      </Grid>
      <Grid
        container
        alignItems="center"
        style={{ marginTop: "1rem" }}
        spacing={1}
      >
        <Grid item xs={12}>
          <TextField
            label="Search student by name"
            variant="outlined"
            fullWidth
            size="small"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </Grid>
      </Grid>
      <TableContainer
        component={Paper}
        sx={{ marginTop: "1em", whiteSpace: "nowrap" }}
      >
        <Table>
          <TableHead>
            <TableRow>
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
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "lastName"}
                  direction={orderBy === "lastName" ? order : "asc"}
                  onClick={(event) => handleRequestSort(event, "lastName")}
                >
                  Student Name
                  {orderBy === "lastName" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "jhsAttended"}
                  direction={orderBy === "jhsAttended" ? order : "asc"}
                  onClick={(event) => handleRequestSort(event, "jhsAttended")}
                >
                  JHS Attended
                  {orderBy === "jhsAttended" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "aggregate"}
                  direction={orderBy === "aggregate" ? order : "asc"}
                  onClick={(event) => handleRequestSort(event, "aggregate")}
                >
                  Aggregate
                  {orderBy === "aggregate" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "program"}
                  direction={orderBy === "program" ? order : "asc"}
                  onClick={(event) => handleRequestSort(event, "program")}
                >
                  Program
                  {orderBy === "program" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "year"}
                  direction={orderBy === "year" ? order : "asc"}
                  onClick={(event) => handleRequestSort(event, "year")}
                >
                  Year
                  {orderBy === "year" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "status"}
                  direction={orderBy === "status" ? order : "asc"}
                  onClick={(event) => handleRequestSort(event, "status")}
                >
                  Status
                  {orderBy === "status" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
              <TableCell align="center">
                <TableSortLabel
                  active={orderBy === "completed"}
                  direction={orderBy === "completed" ? order : "asc"}
                  onClick={(event) => handleRequestSort(event, "completed")}
                >
                  Registered
                  {orderBy === "completed" ? (
                    <Box component="span" sx={visuallyHidden}>
                      {order === "desc"
                        ? "sorted descending"
                        : "sorted ascending"}
                    </Box>
                  ) : null}
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {currentPageData.map((student, index) => (
              <TableRow key={index}>
                <TableCell align="center">{student.indexNumber}</TableCell>
                <TableCell align="center">{`${student.firstName} ${student.lastName}`}</TableCell>
                <TableCell align="center">{student.jhsAttended}</TableCell>
                <TableCell align="center">{student.aggregate}</TableCell>
                <TableCell align="center">
                  {programs[student.program]}
                </TableCell>
                <TableCell align="center">{student.year}</TableCell>
                <TableCell align="center">{student.status}</TableCell>
                <TableCell align="center">
                  {student.completed ? "Yes" : "No"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={sortedStudents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      <AddStudentModal
        open={openAddStudentModal}
        onClose={() => setOpenAddStudentModal(false)}
      />
      <ImportStudentExcel
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        programs={programs}
        schoolID={schoolID}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={alertSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog
        open={openDialog}
        onClose={(event, reason) => {
          if (reason !== "backdropClick") {
            handleDialogClose(false);
          }
        }}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete all unregistered students?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDialogClose(false)}>Cancel</Button>
          <Button onClick={() => handleDialogClose(true)}>Confirm</Button>
        </DialogActions>
      </Dialog>
      <NetworkStatusWarning />
    </div>
  );
};

// Utility functions for sorting
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
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

export default PlacementActions;

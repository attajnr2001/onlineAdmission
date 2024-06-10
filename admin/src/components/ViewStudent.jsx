import React, { useState, useEffect } from "react";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableHead,
  TableRow,
  Paper,
  TextField,
  TableSortLabel,
  Box,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../helpers/firebase";
import { useParams } from "react-router-dom";
import { visuallyHidden } from "@mui/utils";

const ViewStudent = () => {
  const { schoolID } = useParams();
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [programSearchQuery, setProgramSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("indexNumber");

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

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const programName = programs[student.program]?.toLowerCase() || "";
    return (
      fullName.includes(searchQuery.toLowerCase()) &&
      programName.includes(programSearchQuery.toLowerCase())
    );
  });

  const sortedStudents = stableSort(
    filteredStudents,
    getComparator(order, orderBy)
  );

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const slicedStudents = sortedStudents.slice(startIndex, endIndex);

  return (
    <>
      <Grid
        container
        alignItems="center"
        style={{ marginTop: "1rem" }}
        spacing={1}
      >
        <Grid item xs={12} sm={9}>
          <TextField
            label="Search student by name"
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Search by program"
            variant="outlined"
            size="small"
            fullWidth
            value={programSearchQuery}
            onChange={(e) => setProgramSearchQuery(e.target.value)}
          />
        </Grid>
      </Grid>
      <TableContainer component={Paper} sx={{ marginTop: "1em" }}>
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
                  active={orderBy === "admissionNo"}
                  direction={orderBy === "admissionNo" ? order : "asc"}
                  onClick={(event) => handleRequestSort(event, "admissionNo")}
                >
                  Admission Number
                  {orderBy === "admissionNo" ? (
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
            {slicedStudents.map((student, index) => (
              <TableRow key={index}>
                <TableCell align="center">{student.indexNumber}</TableCell>
                <TableCell align="center">{student.admissionNo}</TableCell>
                <TableCell align="center">{`${student.firstName} ${student.lastName}`}</TableCell>
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
        count={filteredStudents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, newPage) => {
          setPage(newPage);
          const startIndex = newPage * rowsPerPage;
          const endIndex = startIndex + rowsPerPage;
        }}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
      />
      <NetworkStatusWarning />
    </>
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

const getProgramName = (programId) => {
  return programs[programId] || "";
};
export default ViewStudent;

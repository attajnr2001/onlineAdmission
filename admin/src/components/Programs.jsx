import React, { useState, useEffect } from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  TableSortLabel,
  TablePagination,
  Box,
} from "@mui/material";
import AddProgramModal from "../mod/AddProgramModal";
import EditProgramModal from "../mod/EditProgramModal";
import { db, auth } from "../helpers/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  addDoc,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { visuallyHidden } from "@mui/utils";
import { useLocationIP, getPlatform } from "../helpers/utils";

const Programs = () => {
  const { schoolID } = useParams();
  const [programs, setPrograms] = useState([]);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("programID");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const locationIP = useLocationIP();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "programs"), where("schoolID", "==", schoolID)),
      (snapshot) => {
        const fetchedPrograms = [];
        snapshot.forEach((doc) => {
          fetchedPrograms.push({ id: doc.id, ...doc.data() });
        });
        setPrograms(fetchedPrograms);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching programs:", error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [schoolID]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAddProgram = (formData) => {
    console.log("Adding new program:", formData);
  };

  const handleEditProgram = (row) => {
    setSelectedRow(row);
    setOpenEditModal(true);
  };

  const handleDeleteProgram = async () => {
    if (!selectedRow) return;

    try {
      const currentUser = auth.currentUser;

      const programDocRef = doc(db, "programs", selectedRow.id);
      await deleteDoc(programDocRef);
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
        action: `Deleted Program: ${selectedRow.name}`,
        actionDate: dateTime,
        adminID: currentUser.email,
        locationIP: locationIP || "",
        platform: getPlatform(),
        schoolID: schoolID,
      });
      console.log("Program deleted successfully.");
    } catch (error) {
      console.error("Error deleting house:", error);
    }

    setOpenDeleteConfirmation(false);
  };

  const handleExportCSV = () => {
    console.log("csv printing");
    const csvData = Papa.unparse(
      programs.map((program) => ({
        ProgramID: program.programID,
        ProgramName: program.name,
        ShortName: program.shortname,
        NumberOfStudents: program.noOfStudents,
      }))
    );
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "programs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("csv printing");
  };

  const handleExportPDF = () => {
    console.log("pdf printing");
    const doc = new jsPDF();
    doc.text("Programs Table", 20, 10);
    doc.autoTable({
      head: [
        ["Program ID", "Program Name", "Short Name", "Number of Students"],
      ],
      body: programs.map((program) => [
        program.programID,
        program.name,
        program.shortname,
        program.noOfStudents,
      ]),
    });
    doc.save("programs.pdf");
  };

  const handleExportExcel = () => {
    console.log("excel printing");
    const workBook = XLSX.utils.book_new();
    const workSheet = XLSX.utils.json_to_sheet(
      programs.map((program) => ({
        ProgramID: program.programID,
        ProgramName: program.name,
        ShortName: program.shortname,
        NumberOfStudents: program.noOfStudents,
      }))
    );
    XLSX.utils.book_append_sheet(workBook, workSheet, "Programs");
    XLSX.writeFile(workBook, "programs.xlsx");
  };

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

  const sortedPrograms = stableSort(programs, getComparator(order, orderBy));

  return (
    <div>
      <div className="house-buttons-container">
        <Button
          sx={{ mb: 2 }}
          variant="contained"
          color="primary"
          size="small"
          onClick={() => setOpenAddModal(true)}
        >
          Add New Program
        </Button>
      </div>
      <div className="house-buttons">
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={handleExportCSV}
        >
          CSV
        </Button>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={handleExportExcel}
        >
          Excel
        </Button>
        <Button
          variant="outlined"
          color="primary"
          size="small"
          onClick={handleExportPDF}
        >
          PDF
        </Button>
        <Button variant="outlined" color="primary" size="small">
          Print
        </Button>
      </div>
      <div className="house-table" id="program-table">
        <TableContainer
          component={Paper}
          sx={{ marginTop: "1em", whiteSpace: "nowrap" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  align="center"
                  sortDirection={orderBy === "programID" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "programID"}
                    direction={orderBy === "programID" ? order : "asc"}
                    onClick={(event) => handleRequestSort(event, "programID")}
                  >
                    Program ID
                    {orderBy === "programID" ? (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sortDirection={orderBy === "name" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "name"}
                    direction={orderBy === "name" ? order : "asc"}
                    onClick={(event) => handleRequestSort(event, "name")}
                  >
                    Program Name
                    {orderBy === "name" ? (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                </TableCell>

                <TableCell
                  align="center"
                  sortDirection={orderBy === "shortname" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "shortname"}
                    direction={orderBy === "shortname" ? order : "asc"}
                    onClick={(event) => handleRequestSort(event, "shortname")}
                  >
                    Short Name
                    {orderBy === "shortname" ? (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                </TableCell>
                <TableCell
                  align="center"
                  sortDirection={orderBy === "noOfStudents" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "noOfStudents"}
                    direction={orderBy === "noOfStudents" ? order : "asc"}
                    onClick={(event) =>
                      handleRequestSort(event, "noOfStudents")
                    }
                  >
                    Number of Students
                    {orderBy === "noOfStudents" ? (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                </TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPrograms
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id}>
                    <TableCell align="center">{row.programID}</TableCell>
                    <TableCell align="center">{row.name}</TableCell>
                    <TableCell align="center">{row.shortname}</TableCell>
                    <TableCell align="center">{row.noOfStudents}</TableCell>
                    <TableCell align="center">
                      <Button
                        onClick={() => handleEditProgram(row)}
                        variant="outlined"
                        size="small"
                        color="primary"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedRow(row);
                          setOpenDeleteConfirmation(true);
                        }}
                        variant="outlined"
                        size="small"
                        color="error"
                        sx={{ ml: 1 }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={programs.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      </div>
      <AddProgramModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onAddProgram={handleAddProgram}
      />
      <EditProgramModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        program={selectedRow}
      />
      <Dialog
        open={openDeleteConfirmation}
        onClose={() => setOpenDeleteConfirmation(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          {selectedRow?.noOfStudents > 0 ? (
            <Alert severity="warning">
              This house has students assigned to it. Deleting it will also
              remove all associated students houses
            </Alert>
          ) : (
            "Are you sure you want to delete this house?"
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteConfirmation(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteProgram} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

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

export default Programs;

import React, { useState, useEffect } from "react";
// import "../styles/houses.css";
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
import AddHouseModal from "../mod/AddHouseModal";
import EditHouseModal from "../mod/EditHouseModal";
import { db } from "../helpers/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { visuallyHidden } from "@mui/utils";

const Houses = () => {
  const { schoolID } = useParams();
  const [houses, setHouses] = useState([]);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("name");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "houses"), where("schoolID", "==", schoolID)),
      (snapshot) => {
        const fetchedHouses = [];
        snapshot.forEach((doc) => {
          fetchedHouses.push({ id: doc.id, ...doc.data() });
        });
        setHouses(fetchedHouses);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching houses:", error);
        setError(error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const sortedHouses = stableSort(houses, getComparator(order, orderBy));

  const handleAddHouse = (formData) => {
    console.log("Adding new house:", formData);
  };

  const handleEditHouse = (row) => {
    setSelectedRow(row);
    setOpenEditModal(true);
  };

  const handleDeleteHouse = async () => {
    if (!selectedRow) return;

    try {
      const houseDocRef = doc(db, "houses", selectedRow.id);
      await deleteDoc(houseDocRef);
      console.log("House deleted successfully.");
    } catch (error) {
      console.error("Error deleting house:", error);
    }

    setOpenDeleteConfirmation(false);
  };

  const handleExportPDF = () => {
    console.log("pdf printing");

    const doc = new jsPDF();
    doc.text("House Table", 20, 10);
    doc.autoTable({
      head: [["Houses", "Gender", "Bed Capacity", "Number", "Priority"]],
      body: houses.map((house) => [
        house.name,
        house.gender,
        house.bedCapacity,
        house.noOfStudent,
        house.priority,
      ]),
    });
    doc.save("Houses.pdf");
  };

  const handleExportExcel = () => {
    console.log("excel printing");
    const workBook = XLSX.utils.book_new();
    const workSheet = XLSX.utils.json_to_sheet(
      houses.map((house) => ({
        House: house.name,
        Gender: house.gender,
        Bed: house.bedCapacity,
        Students: house.noOfStudent,
        Priority: house.priority,
      }))
    );

    XLSX.utils.book_append_sheet(workBook, workSheet, "Students Houses");
    XLSX.writeFile(workBook, "student-houses.xlsx");
  };

  const handleExportCSV = () => {
    console.log("csv printing");
    const csvData = Papa.unparse(
      houses.map((house) => ({
        House: house.name,
        Gender: house.gender,
        Bed: house.bedCapacity,
        Students: house.noOfStudent,
        Priority: house.priority,
      }))
    );
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "student-houses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("csv printing");
  };

  return (
    <div>
      <div className="house-buttons-container" style={{ marginBottom: "1rem" }}>
        <Button
          variant="contained"
          color="primary"
          size="small"
          onClick={() => setOpenAddModal(true)}
        >
          Add New House
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
      </div>
      <div className="house-table">
        <TableContainer component={Paper} sx={{ whiteSpace: "nowrap", my: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  align="center"
                  sortDirection={orderBy === "name" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "name"}
                    direction={orderBy === "name" ? order : "asc"}
                    onClick={(event) => handleRequestSort(event, "name")}
                  >
                    House{" "}
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
                  sortDirection={orderBy === "gender" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "gender"}
                    direction={orderBy === "gender" ? order : "asc"}
                    onClick={(event) => handleRequestSort(event, "gender")}
                  >
                    Gender
                    {orderBy === "gender" ? (
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
                  sortDirection={orderBy === "bedCapacity" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "bedCapacity"}
                    direction={orderBy === "bedCapacity" ? order : "asc"}
                    onClick={(event) => handleRequestSort(event, "bedCapacity")}
                  >
                    Bed Capacity
                    {orderBy === "bedCapacity" ? (
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
                  sortDirection={orderBy === "noOfStudent" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "noOfStudent"}
                    direction={orderBy === "noOfStudent" ? order : "asc"}
                    onClick={(event) => handleRequestSort(event, "noOfStudent")}
                  >
                    Number
                    {orderBy === "noOfStudent" ? (
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
                  sortDirection={orderBy === "priority" ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === "priority"}
                    direction={orderBy === "priority" ? order : "asc"}
                    onClick={(event) => handleRequestSort(event, "priority")}
                  >
                    Priority
                    {orderBy === "priority" ? (
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
              {sortedHouses
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id}>
                    <TableCell align="center">{row.name}</TableCell>
                    <TableCell align="center">{row.gender}</TableCell>
                    <TableCell align="center">{row.bedCapacity}</TableCell>
                    <TableCell align="center">{row.noOfStudent}</TableCell>
                    <TableCell align="center">{row.priority}</TableCell>
                    <TableCell align="center" className="actions">
                      <Button
                        variant="outlined"
                        color="primary"
                        size="small"
                        onClick={() => handleEditHouse(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => {
                          setSelectedRow(row);
                          setOpenDeleteConfirmation(true);
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <AddHouseModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onAddHouse={handleAddHouse}
      />

      <EditHouseModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        rowData={selectedRow}
      />

      <Dialog
        open={openDeleteConfirmation}
        onClose={() => setOpenDeleteConfirmation(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this house?
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteConfirmation(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button onClick={handleDeleteHouse} color="error">
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

export default Houses;

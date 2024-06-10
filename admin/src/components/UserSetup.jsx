import React, { useState, useEffect, useContext } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component

import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../helpers/firebase";
import { useParams } from "react-router-dom";
import AddUserModal from "../mod/AddUserModal";
import EditUserModal from "../mod/EditUserModal";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { AuthContext } from "../context/AuthContext";

const UserSetup = () => {
  const [admins, setAdmins] = useState([]);
  const { schoolID } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});
  const [currentAdminRole, setCurrentAdminRole] = useState(null);

  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchCurrentAdminRole = async () => {
      try {
        const adminQuery = query(
          collection(db, "admin"),
          where("email", "==", currentUser.email)
        );
        const querySnapshot = await getDocs(adminQuery);
        if (!querySnapshot.empty) {
          const currentAdmin = querySnapshot.docs[0].data();
          setCurrentAdminRole(currentAdmin.role);
        }
        console.log(currentAdminRole);
      } catch (error) {
        console.error("Error fetching current admin role:", error);
      }
    };

    if (currentUser && currentUser.email) {
      fetchCurrentAdminRole();
    }
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "admin"), where("schoolID", "==", schoolID)),
      (snapshot) => {
        const fetchedUsers = [];
        snapshot.forEach((doc) => {
          fetchedUsers.push({ id: doc.id, ...doc.data() });
        });
        setAdmins(fetchedUsers);
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

  const handleAddUser = () => {};

  const handleEditUser = (admin) => {
    setSelectedUser({ ...admin }); // Update the selectedUser object with the correct data
    setOpenEditModal(true);
  };

  const handleExportCSV = () => {
    const csvData = Papa.unparse(
      admins.map((admin) => ({
        Email: admin.email,
        FullName: admin.fullName,
        Phone: admin.phone,
        Role: admin.role,
        Status: admin.active ? "Active" : "Inactive",
      }))
    );
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Users Table", 20, 10);
    doc.autoTable({
      head: [["Email", "Full Name", "Phone", "Role", "Status"]],
      body: admins.map((admin) => [
        admin.email,
        admin.fullName,
        admin.phone,
        admin.role,
        admin.active ? "Active" : "Inactive",
      ]),
    });
    doc.save("users.pdf");
  };

  const handleExportExcel = () => {
    const workBook = XLSX.utils.book_new();
    const workSheet = XLSX.utils.json_to_sheet(
      admins.map((admin) => ({
        Email: admin.email,
        FullName: admin.fullName,
        Phone: admin.phone,
        Role: admin.role,
        Status: admin.active ? "Active" : "Inactive",
      }))
    );
    XLSX.utils.book_append_sheet(workBook, workSheet, "Users");
    XLSX.writeFile(workBook, "users.xlsx");
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

  return (
    <div style={{ minHeight: "86vh" }}>
      <div className="house-buttons-container">
        <Button
          sx={{ mb: 2 }}
          variant="contained"
          color="primary"
          size="small"
          onClick={() => setOpenAddModal(true)}
        >
          Add New User
        </Button>
      </div>

      <div className="house-buttons" style={{ marginBottom: "2rem" }}>
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
                <TableCell align="center">Email</TableCell>
                <TableCell align="center">Full Name</TableCell>
                <TableCell align="center">Phone</TableCell>
                <TableCell align="center">Role</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.map((admin, index) => (
                <TableRow key={index}>
                  <TableCell align="center">{admin.email}</TableCell>
                  <TableCell align="center">{admin.fullName}</TableCell>
                  <TableCell align="center">{admin.phone}</TableCell>
                  <TableCell align="center">{admin.role}</TableCell>
                  <TableCell align="center">
                    {admin.active ? "Active" : "Inactive"}
                  </TableCell>
                  <TableCell align="center" className="actions">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleEditUser(admin)}
                      disabled={currentAdminRole !== "Super"}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <AddUserModal
        open={openAddModal}
        onClose={() => setOpenAddModal(false)}
        onAddUser={handleAddUser}
        selectedUser={selectedUser}
      />

      <EditUserModal
        open={openEditModal}
        onClose={() => setOpenEditModal(false)}
        selectedUser={selectedUser}
      />
      <NetworkStatusWarning />
    </div>
  );
};

export default UserSetup;

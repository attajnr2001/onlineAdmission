import React, { useState, useEffect } from "react";
import { db } from "../helpers/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { useParams } from "react-router-dom";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Alert,
} from "@mui/material";
import jsPDF from "jspdf";
import "jspdf-autotable";

const Logs = () => {
  const { schoolID } = useParams();
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getCurrentTime = async () => {
    const response = await fetch(
      "http://worldtimeapi.org/api/timezone/Africa/Accra"
    );
    const data = await response.json();
    const currentTime = new Date(data.datetime);
    return currentTime;
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsCollectionRef = collection(db, "logs");
        const logsQuery = query(
          logsCollectionRef,
          where("schoolID", "==", schoolID)
        );

        const unsubscribe = onSnapshot(logsQuery, async (querySnapshot) => {
          const fetchedLogs = [];

          const adminCollection = collection(db, "admin");

          for (const _doc of querySnapshot.docs) {
            const logData = _doc.data();
            const date = await getCurrentTime(); // Use the World Time API to get the current time
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString();

            // Fetch adminFullName from admin collection based on adminID
            const adminEmail = logData.adminID; // Use adminEmail instead of adminID
            const adminQuery = query(
              adminCollection,
              where("email", "==", adminEmail)
            ); // Query based on email
            const adminQuerySnapshot = await getDocs(adminQuery);
            let adminFullName = "Unknown";

            adminQuerySnapshot.forEach((doc) => {
              adminFullName = doc.data().fullName;
            });

            fetchedLogs.push({
              id: _doc.id,
              ...logData,
              formattedDate,
              formattedTime,
              adminFullName,
            });
          }

          fetchedLogs.sort((a, b) => b.actionDate - a.actionDate);
          setLogs(fetchedLogs);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching logs:", error);
        setError(error);
        setLoading(false);
      }
    };

    fetchLogs();
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    const startIndex = newPage * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handlePrintActivityLog = () => {
    const doc = new jsPDF();
    doc.text("Activity Log", 20, 10);
    doc.autoTable({
      head: [
        ["Username", "Date", "Time", "Action", "Location IP", "Platform Used"],
      ],
      body: logs.map((log) => [
        log.adminFullName,
        log.formattedDate,
        log.formattedTime,
        log.action,
        log.locationIP,
        log.platform,
      ]),
    });
    doc.save("activity-log.pdf");
  };

  const startIndex = page * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const slicedLogs = logs.slice(startIndex, endIndex);

  return (
    <div>
      <Button
        variant="contained"
        onClick={handlePrintActivityLog}
        sx={{ marginBottom: "1em" }}
        size="small"
      >
        Print Activity Log
      </Button>
      <TableContainer component={Paper} sx={{ whiteSpace: "nowrap" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Location IP</TableCell>
              <TableCell>Platform Used</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {slicedLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.adminFullName}</TableCell>
                <TableCell>{log.formattedDate}</TableCell>
                <TableCell>{log.formattedTime}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.locationIP}</TableCell>
                <TableCell>{log.platform}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10]}
        component="div"
        count={logs.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default Logs;

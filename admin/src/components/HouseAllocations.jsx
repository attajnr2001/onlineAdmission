import React, { useEffect, useState } from "react";
import { Button, Box } from "@mui/material";
import Widget from "../components/Widget";
import "../styles/widget.css";
import Chart from "./Chart";
import { db } from "../helpers/firebase";
import { useParams } from "react-router-dom";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning";
import { collection, query, where, onSnapshot } from "firebase/firestore";

const HouseAllocations = () => {
  const [houseData, setHouseData] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [boardingStudents, setBoardingStudents] = useState(0);
  const [dayStudents, setDayStudents] = useState(0);
  const { schoolID } = useParams();
  const [showWidgets, setShowWidgets] = useState(false);
  ("DAY");
  const toggleWidgets = () => {
    setShowWidgets(!showWidgets);
  };

  useEffect(() => {
    const fetchHouseData = () => {
      const q = query(
        collection(db, "houses"),
        where("schoolID", "==", schoolID)
      );
      return onSnapshot(
        q,
        (snapshot) => {
          const fetchedHouses = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setHouseData(fetchedHouses);
        },
        (error) => {
          console.error("Error fetching houses:", error);
        }
      );
    };

    const fetchStudentData = () => {
      const q = query(
        collection(db, "students"),
        where("schoolID", "==", schoolID),
        where("completed", "==", true)
      );
      return onSnapshot(
        q,
        (snapshot) => {
          let total = 0;
          let boarding = 0;
          let day = 0;

          snapshot.forEach((doc) => {
            total += 1;
            const status = doc.data().status.toLowerCase();
            console.log(status);
            if (status === "BOARDING") {
              boarding += 1;
            } else if (status === "DAY") {
              day += 1;
            }
          });

          setTotalStudents(total);
          setBoardingStudents(boarding);
          setDayStudents(day);
        },
        (error) => {
          console.error("Error fetching students:", error);
        }
      );
    };

    const unsubscribeHouses = fetchHouseData();
    const unsubscribeStudents = fetchStudentData();

    return () => {
      unsubscribeHouses();
      unsubscribeStudents();
    };
  }, [schoolID]);

  const handlePrintHouseAllocations = () => {
    console.log("Printing house allocations...");
  };

  return (
    <div>
      <Button
        variant="contained"
        color="primary"
        size="small"
        onClick={handlePrintHouseAllocations}
      >
        Print House Allocations
      </Button>

      <Box
        sx={{
          display: { xs: "block", md: "flex" },
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          gap: 2,
          padding: 2,
        }}
      >
        <Widget type="total" pop={totalStudents} />
        <Widget type="BOARDING" pop={boardingStudents} />
        <Widget type="DAY" pop={dayStudents} />
      </Box>
      <div className="chart">
        <Chart
          aspect={2 / 1}
          title={"Summary of House Allocation"}
          data={houseData}
        />
      </div>
      <NetworkStatusWarning />
    </div>
  );
};

export default HouseAllocations;

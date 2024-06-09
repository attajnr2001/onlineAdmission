import React, { useEffect, useState } from "react";
import { Button, Box } from "@mui/material";
import Widget from "../components/Widget";
import "../styles/widget.css";
import Chart from "./Chart";
import { db } from "../helpers/firebase";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

const HouseAllocations = () => {
  const [houseData, setHouseData] = useState([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [boardingStudents, setBoardingStudents] = useState(0);
  const [dayStudents, setDayStudents] = useState(0);
  const { schoolID } = useParams();
  const [showWidgets, setShowWidgets] = useState(false);

  const toggleWidgets = () => {
    setShowWidgets(!showWidgets);
  };

  useEffect(() => {
    const unsubscribeHouses = onSnapshot(
      query(collection(db, "houses"), where("schoolID", "==", schoolID)),
      (snapshot) => {
        const fetchedHouses = [];
        snapshot.forEach((doc) => {
          fetchedHouses.push({ id: doc.id, ...doc.data() });
        });
        setHouseData(fetchedHouses);
      },
      (error) => {
        console.error("Error fetching houses:", error);
      }
    );

    const fetchTotalStudents = () => {
      const unsubscribeStudents = onSnapshot(
        query(
          collection(db, "students"),
          where("schoolID", "==", schoolID),
          where("completed", "==", true)
        ),
        (snapshot) => {
          setTotalStudents(snapshot.size);
        },
        (error) => {
          console.error("Error fetching total students:", error);
        }
      );

      return unsubscribeStudents;
    };

    const fetchBoardingStudents = () => {
      const unsubscribeBoarding = onSnapshot(
        query(
          collection(db, "students"),
          where("schoolID", "==", schoolID),
          where("status", "==", "boarding"),
          where("completed", "==", true)
        ),
        (snapshot) => {
          setBoardingStudents(snapshot.size);
        },
        (error) => {
          console.error("Error fetching boarding students:", error);
        }
      );

      return unsubscribeBoarding;
    };

    const fetchDayStudents = () => {
      const unsubscribeDay = onSnapshot(
        query(
          collection(db, "students"),
          where("schoolID", "==", schoolID),
          where("completed", "==", true),
          where("status", "==", "day")
        ),
        (snapshot) => {
          setDayStudents(snapshot.size);
        },
        (error) => {
          console.error("Error fetching day students:", error);
        }
      );

      return unsubscribeDay;
    };

    fetchTotalStudents();
    fetchBoardingStudents();
    fetchDayStudents();

    return () => {
      unsubscribeHouses();
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
        <Widget type="boarding" pop={boardingStudents} />
        <Widget type="day" pop={dayStudents} />
      </Box>
      <div className="chart">
        <Chart
          aspect={2 / 1}
          title={"Summary of House Allocation"}
          data={houseData}
        />
      </div>
    </div>
  );
};

export default HouseAllocations;

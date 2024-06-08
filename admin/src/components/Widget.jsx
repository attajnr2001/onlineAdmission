import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../helpers/firebase";
import "../styles/widget.css";
import {
  Verified,
  CheckCircle,
  Cancel,
  Chalet,
  HolidayVillage,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import LoadingSkeleton from "./LoadingSkeleton"; // Import the Skeleton component
import { motion, AnimatePresence } from "framer-motion";

const Widget = ({ type }) => {
  const [loading, setLoading] = useState(true);
  const [pop, setPop] = useState(0);
  const [admittedPop, setAdmittedPop] = useState(0);
  const [notAdmittedPop, setNotAdmittedPop] = useState(0);
  const [dayPop, setDayPop] = useState(0);
  const [boardingPop, setBoardingPop] = useState(0);
  const { schoolID } = useParams();
  const [diff, setDiff] = useState(null);
  let data;

  useEffect(() => {
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, where("schoolID", "==", schoolID));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totalStudents = snapshot.size;
      setPop(totalStudents);
      setLoading(false); // Set loading to false when data is loaded
    });

    return () => unsubscribe();
  }, [schoolID]);

  useEffect(() => {
    const studentsRef = collection(db, "students");
    const q = query(
      studentsRef,
      where("schoolID", "==", schoolID),
      where("completed", "==", true)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totalAdmitted = snapshot.size;
      setAdmittedPop(totalAdmitted);
    });

    return () => unsubscribe();
  }, [schoolID]);

  useEffect(() => {
    const studentsRef = collection(db, "students");
    const q = query(
      studentsRef,
      where("schoolID", "==", schoolID),
      where("completed", "==", false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totalAdmitted = snapshot.size;
      setNotAdmittedPop(totalAdmitted);
    });

    return () => unsubscribe();
  }, [schoolID]);

  useEffect(() => {
    const studentsRef = collection(db, "students");
    const q = query(
      studentsRef,
      where("schoolID", "==", schoolID),
      where("completed", "==", true),
      where("status", "==", "day")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totalAdmitted = snapshot.size;
      setDayPop(totalAdmitted);
    });

    return () => unsubscribe();
  }, [schoolID]);

  useEffect(() => {
    const studentsRef = collection(db, "students");
    const q = query(
      studentsRef,
      where("schoolID", "==", schoolID),
      where("completed", "==", true),
      where("status", "==", "boarding")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totalAdmitted = snapshot.size;
      setBoardingPop(totalAdmitted);
    });

    return () => unsubscribe();
  }, [schoolID]);

  if (loading) {
    return <LoadingSkeleton />; // Render Skeleton while loading
  }

  switch (type) {
    case "placed":
      data = {
        title: "PLACED BY CSSPS",
        query: "placed",
        link: "View all",
        pop: pop,
        perc: 100,
        icon: (
          <Verified
            className="icon"
            style={{
              backgroundColor: "rgba(0, 128, 0, 0.2)",
              color: "green",
            }}
          />
        ),
      };
      break;
    case "admitted":
      data = {
        title: "COMPLETED ONLINE ADMISSION PROCESS",
        link: "View all",
        pop: admittedPop,
        perc: Math.floor((admittedPop / pop) * 100),
        icon: (
          <CheckCircle
            className="icon"
            style={{
              backgroundColor: "rgba(218, 165, 32, 0.2)",
              color: "goldenrod",
            }}
          />
        ),
      };
      break;
    case "regected":
      data = {
        title: "YET TO PERFORM ONLINE ADMISSION",
        link: "View all",
        pop: notAdmittedPop,
        perc: Math.ceil((notAdmittedPop / pop) * 100),
        icon: (
          <Cancel
            className="icon"
            style={{
              color: "crimson",
              backgroundColor: "rgba(255, 0, 0, 0.2)",
            }}
          />
        ),
      };
      break;
    // widget for house allocations
    case "total":
      data = {
        title: "TOTAL REGISTERED STUDENTS",
        query: "total",
        link: "View all",
        pop: admittedPop,
        perc: 100,
        icon: (
          <Verified
            className="icon"
            style={{
              backgroundColor: "rgba(0, 128, 0, 0.2)",
              color: "green",
            }}
          />
        ),
      };
      break;
    case "boarding":
      data = {
        title: "BOARDING STUDENTS",
        query: "boarding",
        link: "View all",
        pop: boardingPop,
        perc: Math.floor((boardingPop / admittedPop) * 100),
        icon: (
          <HolidayVillage
            className="icon"
            style={{
              backgroundColor: "rgba(0, 128, 0, 0.2)",
              color: "green",
            }}
          />
        ),
      };
      break;
    case "day":
      data = {
        title: "DAY STUDENTS",
        query: "day",
        link: "View all",
        pop: dayPop,
        perc: Math.ceil((dayPop / admittedPop) * 100),
        icon: (
          <Chalet
            className="icon"
            style={{
              backgroundColor: "rgba(0, 128, 0, 0.2)",
              color: "green",
            }}
          />
        ),
      };
      break;
    default:
      break;
  }

  return (
    <AnimatePresence>
      <motion.div
        className="widget"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="left">
          <span className="title">{data.title}</span>
          <span className="pop">{data.pop}</span>
          <span className="link">{data.link}</span>
        </div>
        <div className="right">
          <div className="percentage positive">
            {data.perc}
            {diff}%
          </div>
          {data.icon}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Widget;

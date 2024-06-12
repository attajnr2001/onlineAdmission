import React, { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../helpers/firebase";
import "../styles/widget.css";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning";
import {
  Verified,
  CheckCircle,
  Cancel,
  Chalet,
  HolidayVillage,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import LoadingSkeleton from "./LoadingSkeleton";
import { motion, AnimatePresence } from "framer-motion";

const Widget = React.memo(({ type }) => {
  const [loading, setLoading] = useState(true);
  const [pop, setPop] = useState(0);
  const [admittedPop, setAdmittedPop] = useState(0);
  const [notAdmittedPop, setNotAdmittedPop] = useState(0);
  const [dayPop, setDayPop] = useState(0);
  const [boardingPop, setBoardingPop] = useState(0);
  const { schoolID } = useParams();
  const [diff, setDiff] = useState(null);

  const widgetData = useMemo(() => {
    switch (type) {
      case "placed":
        return {
          title: "PLACED BY CSSPS",
          query: "placed",
          link: "View all",
          pop,
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
      case "admitted":
        return {
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
      case "regected":
        return {
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
      default:
        return {};
    }
  }, [type, pop, admittedPop, notAdmittedPop]);

  useEffect(() => {
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, where("schoolID", "==", schoolID));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totalStudents = snapshot.size;
      setPop(totalStudents);
      setLoading(false);
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
      const totalNotAdmitted = snapshot.size;
      setNotAdmittedPop(totalNotAdmitted);
    });

    return () => unsubscribe();
  }, [schoolID]);

  useEffect(() => {
    const studentsRef = collection(db, "students");
    const q = query(
      studentsRef,
      where("schoolID", "==", schoolID),
      where("completed", "==", true),
      where("status", "==", "DAY")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totalDayStudents = snapshot.size;
      setDayPop(totalDayStudents);
    });

    return () => unsubscribe();
  }, [schoolID]);

  useEffect(() => {
    const studentsRef = collection(db, "students");
    const q = query(
      studentsRef,
      where("schoolID", "==", schoolID),
      where("completed", "==", true),
      where("status", "==", "BOARDING")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const totalBoardingStudents = snapshot.size;
      setBoardingPop(totalBoardingStudents);
    });

    return () => unsubscribe();
  }, [schoolID]);

  if (loading) {
    return <LoadingSkeleton />; // Render Skeleton while loading
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="widget"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="left">
            <span className="title">{widgetData.title}</span>
            <span className="pop">{widgetData.pop}</span>
            <span className="link">{widgetData.link}</span>
          </div>
          <div className="right">
            <div className="percentage positive">
              {widgetData.perc}
              {diff}%
            </div>
            {widgetData.icon}
          </div>
        </motion.div>
      </AnimatePresence>
      <NetworkStatusWarning />
    </>
  );
});

export default Widget;

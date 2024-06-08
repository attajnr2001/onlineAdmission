import React, { useState, useEffect } from "react";
import { Avatar, Typography, Button, Grid, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DescriptionIcon from "@mui/icons-material/Description";
import TaskIcon from "@mui/icons-material/Task";
import ArticleIcon from "@mui/icons-material/Article";
import jsPDF from "jspdf";
import {
  collection,
  getDoc,
  doc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../helpers/firebase";
import "../styles/dashboard.css";
import LoadingSkeleton from "../components/LoadingSkeleton";
import { motion, AnimatePresence } from "framer-motion";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  display: "flex", // Added flex display
  alignItems: "center", // Center vertically
  flexDirection: "column", // Column direction to stack items vertically
  height: "100%", // Make the Item fill the Grid item's height
}));

const LeftAlignedItem = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(2),
  textAlign: "left",
  color: theme.palette.text.secondary,
}));

const Dashboard = () => {
  const { schoolID, studentID } = useParams();
  const [student, setStudent] = useState({});
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState({});
  const [house, setHouse] = useState({});
  const [instructions, setInstructions] = useState([]);
  const [prospectus, setProspectus] = useState("");
  const [undertaking, setUndertaking] = useState("");

  const handleGeneratePersonalRecords = () => {
    // designing of the personal records
    const doc = new jsPDF();
    doc.text(`Name: ${student.firstName} ${student.lastName}`, 10, 10);
    doc.text(`Permanent Address: ${student.permanentAddress}`, 10, 20);
    doc.text(`Raw Score: ${student.rawScore}`, 10, 30);
    doc.save("personal_records.pdf");
  };

  // this is a function that generates a pdf as an admission letter for the student
  const handleGenerateAdmissionLetter = async () => {
    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.toLocaleString("default", { month: "long" });
    const year = currentDate.getFullYear();
    const formattedDate = `${day}th ${month} ${year}`;

    /**
     * makes a call to the node server to fetch student image
     * this was to prevent CORS error
     */
    const proxyUrl = "http://localhost:3001/proxy-image?url=";
    const imageUrl = `${proxyUrl}${encodeURIComponent(student.image)}`;

    const schoolData = await getDoc(doc(db, `school/${schoolID}`));
    const school = schoolData.data();
    const schoolImageData = schoolData.data();
    const schoolImageBase64 = schoolImageData.image;

    try {
      //fethes the image url from the firetore
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      const base64String = await new Promise((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result);
        };
      });

      // designing of the admission letter
      const imageBase64 = base64String.split(",")[1];
      const doc = new jsPDF();
      doc.addImage(schoolImageBase64, "JPEG", 10, 10, 10, 10);
      doc.setFontSize(10);
      doc.setFont("", "bold");
      doc.text(`${school.name}`, 23, 14);
      doc.text(`Post Office Box ${school.box}`, 23, 18);

      doc.text(`${school.name}`, 23, 14);

      doc.setFont("", "bold");
      doc.setFontSize(18);
      doc.text(`${school.name.toUpperCase()} SCHOOL`, 60, 30);

      doc.setFontSize(10);
      doc.text(`(GHANA EDUCATION SERVICE)`, 65, 35);

      // address
      doc.text(`THE HEADMASTER`, 10, 44);
      doc.text(`OUR REF NUMBER:  ${school.box}`, 10, 48);
      doc.text(`YOUR REF NUMBER: ...............`, 10, 52);
      doc.text(`PHONE: ${school.phone}`, 10, 56);
      doc.text(`EMAIL: ${school.email}`, 10, 60);

      doc.text(`POST OFFICE BOX: ${school.box}`, 155, 44);
      doc.text(`Date: ${formattedDate}`, 155, 48);

      doc.addImage(imageBase64, "JPEG", 90, 44, 35, 35);
      doc.save("admission_letter.pdf");
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  };

  // fetch student data from students collection
  useEffect(() => {
    const fetchStudentData = async () => {
      const studentData = await getDoc(doc(db, `students/${studentID}`));
      setStudent(studentData.data());
      setLoading(false);

      // finds the student's program base on the student program value
      // which is an id in the programs collection
      const programID = studentData.data().program;
      const programData = await getDoc(doc(db, `programs/${programID}`));
      setProgram(programData.data());

      // finds the student's house base on the student house value
      // which is an id in the houses collection
      const houseID = studentData.data().house;
      const houseData = await getDoc(doc(db, `houses/${houseID}`));
      setHouse(houseData.data());
    };
    fetchStudentData();
  }, [studentID]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "admission"), where("schoolID", "==", schoolID)),
      (snapshot) => {
        const fetchedInstructions = [];
        snapshot.forEach((doc) => {
          fetchedInstructions.push(...doc.data().announcement);
        });
        setInstructions(fetchedInstructions);

        const prospectus = snapshot.docs[0].data().prospectus;
        setProspectus(prospectus);

        const undertaking = snapshot.docs[0].data().undertaking;
        setUndertaking(undertaking);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching instructions:", error);
        setError(error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [schoolID]);

  return (
    <>
      <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
        <Grid item xs={12} md={4}>
          <Item>
            {loading ? (
              <LoadingSkeleton />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Avatar
                    alt="User Avatar"
                    src={student.image}
                    sx={{ width: 100, height: 100 }}
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Typography
                    sx={{ textTransform: "uppercase", fontWeight: "bold" }}
                  >
                    {student.firstName} {student.lastName}
                  </Typography>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                >
                  <Typography
                    sx={{ fontSize: "smaller", fontWeight: "bold", mb: 1 }}
                  >
                    Student Number: {student.admissionNo}
                  </Typography>
                </motion.div>
              </motion.div>
            )}

            <Button
              variant="contained"
              color="primary"
              component={Link}
              size="small"
              to={"edit-student"}
            >
              Edit
            </Button>

            <Typography
              variant="body1"
              style={{
                margin: "8px 0",
                color: student.completed ? "green" : "red",
                fontWeight: "bold",
              }}
            >
              {/* display color green or red based on student.completd value */}
              {student.completed ? "REGISTERED" : "NOT REGISTERED"}
            </Typography>
          </Item>
        </Grid>

        <Grid item xs={12} md={8}>
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <Grid
              container
              rowSpacing={2}
              columnSpacing={{ xs: 1, sm: 2, md: 3 }}
              sx={{ mt: { xs: 1, md: 0 } }}
            >
              <Grid item xs={12} md={6}>
                <LeftAlignedItem>
                  <h5>Index Number</h5>

                  <Typography variant="body1" className="info">
                    {student.indexNumber}
                  </Typography>
                </LeftAlignedItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <LeftAlignedItem>
                  <h5>Program</h5>
                  <Typography variant="body1" className="info">
                    {program.name}
                  </Typography>
                </LeftAlignedItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <LeftAlignedItem>
                  <h5>Gender</h5>
                  <Typography variant="body1" className="info">
                    {student.gender}
                  </Typography>
                </LeftAlignedItem>
              </Grid>

              <Grid item xs={12} md={6}>
                <LeftAlignedItem>
                  <h5>Residential Status</h5>
                  <Typography
                    variant="body1"
                    sx={{ textTransform: "capitalize" }}
                    className="info"
                  >
                    {student.status}
                  </Typography>
                </LeftAlignedItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <LeftAlignedItem>
                  <h5>House</h5>
                  <Typography variant="body1" className="info">
                    {house.name}
                  </Typography>
                </LeftAlignedItem>
              </Grid>
              <Grid item xs={12} md={6}>
                <LeftAlignedItem>
                  <h5>Year</h5>
                  <Typography variant="body1" className="info">
                    {student.year}
                  </Typography>
                </LeftAlignedItem>
              </Grid>
            </Grid>
          )}
        </Grid>

        <Grid item xs={12} sx={{ mt: 4 }}>
          <LeftAlignedItem>
            <a href={prospectus} target="_blank" download>
              <Button variant="outlined" color="primary">
                <ArticleIcon />
                Download Prospectus
              </Button>
            </a>
          </LeftAlignedItem>
        </Grid>
        <Grid item xs={12}>
          <LeftAlignedItem>
            <Button
              variant="outlined"
              onClick={handleGenerateAdmissionLetter}
              color="error"
            >
              <TaskIcon />
              Download Admission Letter
            </Button>
          </LeftAlignedItem>
        </Grid>
        <Grid item xs={12}>
          <LeftAlignedItem>
            <Button
              variant="outlined"
              onClick={handleGeneratePersonalRecords}
              color="secondary"
            >
              <DescriptionIcon />
              Downlaod Personal Records
            </Button>
          </LeftAlignedItem>
        </Grid>
        <Grid item xs={12}>
          <LeftAlignedItem>
            <a href={undertaking} target="_blank" download>
              <Button variant="outlined" color="success">
                <InsertDriveFileIcon />
                Download Undertaking
              </Button>
            </a>
          </LeftAlignedItem>

          <h5
            style={{
              margin: "1rem 0",
            }}
          >
            Instructions:
          </h5>

          <ol style={{ margin: "1em 0" }}>
            {instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </Grid>
      </Grid>
    </>
  );
};

export default Dashboard;

import React, { useState, useEffect } from "react";
import {
  Avatar,
  Typography,
  Button,
  Grid,
  Paper,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DescriptionIcon from "@mui/icons-material/Description";
import TaskIcon from "@mui/icons-material/Task";
import ArticleIcon from "@mui/icons-material/Article";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning";
import jsPDF from "jspdf";
import {
  collection,
  getDoc,
  doc,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import QRCode from "qrcode";
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
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  height: "100%",
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
  const [admission, setAdmissionData] = useState({});
  const [house, setHouse] = useState({});
  const [instructions, setInstructions] = useState([]);
  const [reOpeningDate, setReOpeningDate] = useState("");
  const [reOpeningTime, setReOpeningTime] = useState("");
  const [senderID, setSenderID] = useState("");
  const [prospectus, setProspectus] = useState("");
  const [undertaking, setUndertaking] = useState("");
  const [year, setYear] = useState("");

  const handleGeneratePersonalRecords = async () => {
    // designing of the personal records

    const currentDate = new Date();
    const day = currentDate.getDate();
    const month = currentDate.toLocaleString("default", { month: "long" });
    const year = currentDate.getFullYear();
    const formattedDate = `${day}th ${month} ${year}`;

    const proxyUrl = "http://localhost:3001/proxy-image?url=";
    const imageUrl = `${proxyUrl}${encodeURIComponent(student.image)}`;

    const schoolData = await getDoc(doc(db, `school/${schoolID}`));
    const school = schoolData.data();
    const schoolImageData = schoolData.data();
    const schoolImageBase64 = schoolImageData.image;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      const base64String = await new Promise((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result);
        };
      });

      const imageBase64 = base64String.split(",")[1];
      const doc = new jsPDF();
      doc.addImage(schoolImageBase64, "JPEG", 10, 10, 10, 10);

      let currentY = 14; // Start from y = 14
      doc.setFontSize(10);
      doc.setFont("", "bold"); // Set font to bold
      doc.text(`${school.name}`, 23, currentY);
      doc.setFont("", "normal");
      currentY += 5; // Increment currentY by 5 for the next line

      doc.text(`Post Office Box ${school.box} ${school.address}`, 23, currentY);
      currentY += 2;
      doc.setDrawColor(0); // Set the line color to black (0 is black, 255 is white)
      doc.line(10, currentY, 200, currentY); // Draw a line at the current y-coordinate
      currentY += 10; // Increment currentY by 5 for the next line

      doc.setFontSize(18);
      doc.setFont("", "bold");
      doc.text(`${school.name.toUpperCase()} SCHOOL`, 60, currentY);
      currentY += 10;

      doc.addImage(schoolImageBase64, "JPEG", 85, currentY, 30, 30);
      currentY += 35;

      doc.setFontSize(12);
      doc.text(
        `POST OFFICE BOX ${school.box} ${school.address.toUpperCase()}`,
        60,
        currentY
      );
      currentY += 5;

      doc.text(`PHONE: ${school.phone}`, 72, currentY);
      currentY += 5;

      doc.text(`EMAIL: ${school.email}`, 68, currentY);
      currentY += 5;

      doc.line(10, currentY, 200, currentY); // Draw a line at the current y-coordinate
      currentY += 10;

      doc.setFontSize(18);
      doc.text(`PERSONAL RECORDS FORM`, 60, currentY);

      currentY += 5;

      doc.addImage(imageBase64, "JPEG", 85, currentY, 35, 35);
      currentY += 45;

      doc.setFontSize(12);
      doc.text(`ENROLLMENT DATA`, 80, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Student Name: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(
        `${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`,
        37,
        currentY
      );
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("BECE Index Number: ", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.indexNumber}`, 140, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Admission Number: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(
        `${program.shortname}${yearent.admissionNo}`,
        45,
        currentY
      );
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Residential Status: ", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.status.toUpperCase()}`, 132, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Gender: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.gender}`, 25, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Raw Score: ", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.rawScore}`, 120, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Aggregate of Best 6: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.aggregate}`, 47, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("JHS Attended: ", 100, currentY);
      doc.setFontSize(12);
      doc.setFont("", "bold");
      doc.text(`${student.jhsAttended}`, 127, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Enrollment Code: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.enrollmentCode}`, 42, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("House: ", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${house.name.toUpperCase()}`, 113, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("JHS Type: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.jhsType.toUpperCase()}`, 30, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Class: ", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${""}`, 30, currentY);
      currentY += 15;

      doc.setFontSize(12);
      doc.text(`CONTACT DATA`, 80, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Gender: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.gender.toUpperCase()}`, 25, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Date of Birth: ", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.dateOfBirth}`, 125, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Nationality: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.nationality}`, 30, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Address: ", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.permanentAddress}`, 117, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Place of Birth: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.placeOfBirth}`, 35, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Religion: ", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.religion}`, 117, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Town: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.town}`, 23, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("District: ", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.district}`, 117, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Region: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.enrollmentCode}`, 25, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Interest: ", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.interest}`, 117, currentY);
      currentY += 10;

      // ********************************new page
      doc.addPage();
      doc.addImage(schoolImageBase64, "JPEG", 10, 10, 10, 10);

      currentY = 14; // Start from y = 14
      doc.setFontSize(10);
      doc.setFont("", "bold"); // Set font to bold
      doc.text(`${school.name}`, 23, currentY);
      doc.setFont("", "normal");
      currentY += 5; // Increment currentY by 5 for the next line

      doc.text(`Post Office Box ${school.box} ${school.address}`, 23, currentY);
      currentY += 2;
      doc.setDrawColor(0); // Set the line color to black (0 is black, 255 is white)
      doc.line(10, currentY, 200, currentY); // Draw a line at the current y-coordinate
      currentY += 10; // Increment currentY by 5 for the next line

      doc.setFont("", "bold");
      doc.setFontSize(12);
      doc.text(`PERSONAL DATA`, 80, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Mobile Phone (SMS): ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.smsContact}`, 48, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Other Phone: ", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.otherPhone}`, 125, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Email: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.email}`, 23, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${""}`, 140, currentY);
      currentY += 15;

      doc.setFont("", "bold");
      doc.setFontSize(12);
      doc.text(`PARENTAL DATA`, 80, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Father's Name: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.fathersName}`, 37, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Father's Occupation", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.fathersOccupation}`, 136, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Mother's Name: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.mothersName}`, 38, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Mother's Occupation", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.mothersOccupation}`, 138, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Name of Guardian: ", 10, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.guardian}`, 44, currentY);
      doc.setFontSize(12);
      doc.setFont("", "normal");
      doc.text("Residential Telephone", 100, currentY);
      doc.setFontSize(13);
      doc.setFont("", "bold");
      doc.text(`${student.residentialTelephone}`, 140, currentY);
      currentY += 10;

      doc.setFont("", "bold");
      doc.setFontSize(12);
      doc.text(`CERTIFY`, 10, currentY);
      currentY += 10;

      doc.setFont("", "normal");
      doc.setFontSize(12);
      doc.text(
        `I HEREBY CERTIFY that the information provided in this form is complete, true and correct to the 
best of my knowledge

____________________________________ 
Signature of Student

____________________________________ 
Date
`,
        10,
        currentY
      );
      currentY += 10;

      doc.save("personal.pdf");
    } catch (error) {
      console.log(error);
    }
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
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      const base64String = await new Promise((resolve) => {
        reader.onloadend = () => {
          resolve(reader.result);
        };
      });

      const qrCodeData = "Your ICT";
      const qrCodeBase64 = await QRCode.toDataURL(qrCodeData);

      // designing of the admission letter
      const imageBase64 = base64String.split(",")[1];
      const doc = new jsPDF();
      doc.addImage(schoolImageBase64, "JPEG", 10, 10, 10, 10);

      let currentY = 14; // Start from y = 14
      doc.setFontSize(10);
      doc.setFont("", "bold"); // Set font to bold
      doc.text(`${school.name}`, 23, currentY);
      doc.setFont("", "normal");
      currentY += 5; // Increment currentY by 5 for the next line

      doc.text(`Post Office Box ${school.box} ${school.address}`, 23, currentY);
      currentY += 2;
      doc.setDrawColor(0); // Set the line color to black (0 is black, 255 is white)
      doc.line(10, currentY, 200, currentY); // Draw a line at the current y-coordinate
      currentY += 10; // Increment currentY by 5 for the next line

      doc.setFontSize(18);
      doc.setFont("", "bold");
      doc.text(`${school.name.toUpperCase()} SCHOOL`, 60, currentY);
      currentY += 5;
      doc.setDrawColor(0);

      currentY += 1;

      doc.setFontSize(10);
      doc.text(`(GHANA EDUCATION SERVICE)`, 65, currentY);
      currentY += 5;

      // address
      doc.text(`THE HEADMASTER`, 10, currentY);
      currentY += 5;
      doc.text(`OUR REF NUMBER:  ${admission.senderID}`, 10, currentY);
      currentY += 5;
      doc.text(`YOUR REF NUMBER: ...............`, 10, currentY);
      currentY += 5;
      doc.text(`PHONE: ${school.phone}`, 10, currentY);
      currentY += 5;
      doc.text(`EMAIL: ${school.email}`, 10, currentY);
      currentY += 20;

      doc.text(`POST OFFICE BOX: ${school.box}`, 155, 44);
      doc.text(`Date: ${formattedDate}`, 155, 48);
      doc.addImage(schoolImageBase64, "JPEG", 87, 47, 35, 35);

      doc.line(10, currentY, 200, currentY);

      currentY += 10;
      doc.setFont("", "normal");
      doc.setFontSize(12);
      doc.text(`Dear Student,`, 10, currentY);
      currentY += 12;

      doc.setFont("", "bold");
      doc.setFontSize(12);
      doc.text(
        `OFFER OF ADMISSION INTO SENIOR HIGH SCHOOL- 2023/2024 ACADEMIC YEAR`,
        13,
        currentY
      );
      currentY += 1;
      doc.line(13, currentY, 180, currentY);

      currentY += 10;
      doc.setFont("", "bold");
      doc.addImage(imageBase64, "JPEG", 150, currentY, 30, 30);
      doc.text(`ENROLLMENT CODE: ${student.enrollmentCode}`, 10, currentY);
      currentY += 6;
      doc.text(
        `STUDENT NAME: ${student.firstName.toUpperCase()} ${student.lastName.toUpperCase()}`,
        10,
        currentY
      );
      currentY += 6;
      doc.text(
        `RESIDENTIAL STATUS: ${student.status.toUpperCase()}`,
        10,
        currentY
      );
      currentY += 6;
      doc.text(`PROGRAMME: ${program.name.toUpperCase()}`, 10, currentY);
      currentY += 6;
      doc.text(
        `ADMISSION NUMBER: ${program.shortname}${year}${student.admissionNo}`,
        10,
        currentY
      );
      currentY += 6;
      doc.text(`HOUSE: ${house.name.toUpperCase()}`, 10, currentY);
      currentY += 12;

      currentY += 6;
      doc.setFont("", "normal");
      doc.text(
        `I am pleased to inform you that you have been offered a place at ${school.name.toUpperCase()} to
pursue a 3 year Pre-Tertiary programme leading to the West Africa Senior School Certificate
Examination`,
        10,
        currentY
      );
      currentY += 20;

      doc.text(
        `1. The reporting date for all first year students is on Monday, ${reOpeningDate} AM
        
2.  You will be required to adhere religiously to all school rules and regulations as a student
        
3. All students of the school are considered to be on probation throughout their stay in the school and
could be withdrawn/dismissed at anytime for gross misconduct.


4. On the reporting day, you are to submit a printed copy of this Admission Letter to the Senior
Housemaster/Housemistress for registration and other admission formalities.

 5. All students are expected to have active Health Insurance cards and this would be inspected by
the Housemaster/Housemistress.

6. Please accept our congratulations.

Yours faithfully,

--Digitally Signed and Secured in QR Code--

..........................................................................
${school.headMasterName.toUpperCase()}
(HEADMASTER)
`,
        10,
        currentY
      );
      currentY += 10;

      doc.addImage(qrCodeBase64, "JPEG", 150, currentY + 50, 30, 30);

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
      try {
        const houseData = await getDoc(doc(db, `houses/${houseID}`));
        setHouse(houseData.data());
      } catch (error) {
        console.error("Error fetching house data:", error);
        setHouse({ name: "No House" });
      }
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

  useEffect(() => {
    const fetchAdmissionDetails = () => {
      try {
        const admissionRef = collection(db, "admission");
        const q = query(admissionRef, where("schoolID", "==", schoolID));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          querySnapshot.forEach((doc) => {
            const admissionData = { id: doc.id, ...doc.data() };
            setAdmissionData(admissionData);

            const date = new Date(
              admissionData.reOpeningDateTime.seconds * 1000
            );
            const formattedDate = date.toISOString().split("T")[0];
            const hours = ("0" + date.getHours()).slice(-2);
            const minutes = ("0" + date.getMinutes()).slice(-2);
            const formattedTime = `${hours}:${minutes}`;

            setReOpeningDate(formattedDate);
            setReOpeningTime(formattedTime);
            setSenderID(admissionData.senderID);
            setYear(admissionData.year);
          });
        });

        return () => {
          unsubscribe(); // Unsubscribe when component unmounts
        };
      } catch (error) {
        console.error("Error fetching document:", error);
      }
    };

    fetchAdmissionDetails();
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
                  {student.image ? (
                    <Avatar
                      alt="User Avatar"
                      src={student.image || ""}
                      sx={{ width: 100, height: 100, ml: 2 }}
                    />
                  ) : (
                    <CircularProgress />
                  )}
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
                    Student Number: {program.shortname}
                    {year}
                    {student.admissionNo}
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
              {student.completed ? "REGISTERED" : <CircularProgress />}
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
                    {house.name ? house.name : "No House"}
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
      <NetworkStatusWarning />
    </>
  );
};

export default Dashboard;

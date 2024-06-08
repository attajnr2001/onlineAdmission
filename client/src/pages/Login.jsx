import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import {
  Badge,
  Box,
  Typography,
  Avatar,
  Snackbar,
  Alert,
  Button,
  TextField,
} from "@mui/material";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import CrisisAlertIcon from "@mui/icons-material/CrisisAlert";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import MuiAccordion from "@mui/material/Accordion";
import { useNavigate } from "react-router-dom";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import { useParams } from "react-router-dom";
import { db } from "../helpers/firebase";
import {
  collection,
  getDoc,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import PaystackPop from "@paystack/inline-js";
import LoadingSkeleton from "../components/LoadingSkeleton";

const StyledBadge = styled(Badge, {
  shouldForwardProp: (prop) => prop !== "admissionStatus",
})(({ theme, admissionStatus }) => ({
  "& .MuiBadge-badge": {
    backgroundColor: admissionStatus ? "#44b700" : "#d32f2f", // green if admissionStatus is true, red if false
    color: admissionStatus ? "#44b700" : "#d32f2f", // green if admissionStatus is true, red if false
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": {
      transform: "scale(.8)",
      opacity: 1,
    },
    "100%": {
      transform: "scale(2.4)",
      opacity: 0,
    },
  },
}));

const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  "&:not(:last-child)": {
    borderBottom: 0,
  },
  "&::before": {
    display: "none",
  },
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: "0.9rem" }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor:
    theme.palette.mode === "dark"
      ? "rgba(255, 255, 255, .05)"
      : "rgba(0, 0, 0, .03)",
  flexDirection: "row-reverse",
  "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded": {
    transform: "rotate(90deg)",
  },
  "& .MuiAccordionSummary-content": {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: "1px solid rgba(0, 0, 0, .125)",
}));

const Login = () => {
  const [expanded, setExpanded] = useState("panel1");
  const { schoolID } = useParams();
  const [schoolName, setSchoolName] = useState("");
  const [schoolImage, setSchoolImage] = useState("");
  const [indexNumber, setIndexNumber] = useState("");
  const [school, setSchool] = useState({});
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state
  const [amount, setAmount] = useState(false);
  ``;
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [admissionStatus, setAdmissionStatus] = useState(false);

  useEffect(() => {
    if (!schoolID) return;

    const schoolDocRef = doc(db, "school", schoolID);
    const unsubscribe = onSnapshot(schoolDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const schoolData = docSnapshot.data();
        setSchoolName(schoolData.name);
        setSchoolImage(schoolData.image);
      } else {
        console.log("School document not found");
      }
    });

    return () => unsubscribe();
  }, [schoolID]);

  useEffect(() => {
    const fetchSchoolData = async () => {
      setLoading(true);
      try {
        const schoolDoc = await getDoc(doc(db, `school/${schoolID}`));
        if (schoolDoc.exists()) {
          setSchool(schoolDoc.data());
        } else {
          console.error("School not found");
        }
      } catch (error) {
        setMessage("Error fetching school data");
        setOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchSchoolData();
  }, [schoolID]);

  useEffect(() => {
    const fetchAdmissionData = async () => {
      const admissionCollection = collection(db, "admission");
      const unsubscribe = onSnapshot(admissionCollection, (snapshot) => {
        const admissionData = snapshot.docs.find(
          (doc) => doc.data().schoolID === schoolID
        );
        if (admissionData) {
          const data = admissionData.data();
          setAmount(data.serviceCharge);
          setAdmissionStatus(data.admissionStatus);
        }
      });
      return unsubscribe;
    };
    fetchAdmissionData();
  }, [schoolID]);

  const payment = (foundStudent) => {
    const payStack = new PaystackPop();
    payStack.newTransaction({
      key: process.env.PAYSTACK_LIVE_KEY,
      amount: amount * 100,
      email: "attajnr731@gmail.com",
      firstName: foundStudent.firstName,
      lastName: foundStudent.lastName,
      onSuccess: () => handlePaymentSuccess(foundStudent),
      onCancel: () => {
        setMessage("Payment cancelled");
        setOpen(true);
      },
    });
  };

  useEffect(() => {
    const fetchStudents = async () => {
      const studentsCollection = collection(db, "students");
      const unsubscribe = onSnapshot(studentsCollection, (snapshot) => {
        const studentsArray = snapshot.docs.map((doc) => ({
          id: doc.id,
          indexNumber: doc.data().indexNumber,
          schoolID: doc.data().schoolID,
          firstName: doc.data().firstName,
          lastName: doc.data().lastName,
          hasPaid: doc.data().hasPaid,
        }));
        setStudents(studentsArray);
      });
      return unsubscribe;
    };
    fetchStudents();
  }, []);

  const handlePaymentSuccess = async (foundStudent) => {
    try {
      await updateDoc(doc(db, "students", foundStudent.id), {
        hasPaid: true,
      });
      navigate(`/dashboard/${schoolID}/${foundStudent.id}`);
    } catch (error) {
      setMessage("Error updating payment status");
      setOpen(true);
    }
  };

  const handleLogin = async () => {
    if (!admissionStatus) {
      setMessage("Admission is closed, Contact Administrator of school");
      setOpen(true);
      return;
    }

    try {
      const foundStudent = students.find(
        (student) => student.indexNumber === indexNumber
      );
      if (foundStudent) {
        if (foundStudent.schoolID === schoolID) {
          if (foundStudent.hasPaid) {
            navigate(`/dashboard/${schoolID}/${foundStudent.id}`);
          } else {
            payment(foundStudent);
          }
        } else {
          setMessage("ID not found");
          setOpen(true);
        }
      } else {
        setMessage("Student not found");
        setOpen(true);
      }
    } catch (error) {
      setMessage("Error logging in");
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (panel) => (event, newExpanded) => {
    setExpanded(newExpanded ? panel : false);
  };

  return (
    <>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="85vh"
        textAlign="center"
        flexDirection="column"
      >
        {schoolImage === "" ? (
          <LoadingSkeleton />
        ) : (
          <StyledBadge
            overlap="circular"
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            variant="dot"
            admissionStatus={admissionStatus} // Pass admissionStatus as a prop
          >
            <Avatar
              src={schoolImage}
              sx={{ width: "5rem", height: "5rem", my: 3 }}
              alt={schoolName}
            />
          </StyledBadge>
        )}

        <Typography
          variant="h6"
          sx={{ fontWeight: "bold", mb: 2, textTransform: "uppercase" }}
        >
          WELCOME TO THE {schoolName} ONLINE SHS PLATFORM
        </Typography>

        <div>
          <Accordion
            expanded={expanded === "panel1"}
            onChange={handleChange("panel1")}
          >
            <AccordionSummary
              aria-controls="panel1d-content"
              id="panel1d-header"
            >
              <Typography
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <CrisisAlertIcon color="warning" />
                ADMISSION INSTRUCTIONS
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Enter your B.E.C.E Index Number followed by the year. Eg
                (100000000024)
              </Typography>
            </AccordionDetails>
          </Accordion>
          <Accordion
            expanded={expanded === "panel2"}
            onChange={handleChange("panel2")}
          >
            <AccordionSummary
              aria-controls="panel2d-content"
              id="panel2d-header"
            >
              <Typography
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
              >
                <ErrorOutlineIcon color="error" />
                VERY IMPORTANT NOTICE
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                Please ensure that you have printed your CSSPS PLACEMENT FORM.
                Your ENROLMENT CODE, which can be found on your Placement Form,
                would be REQUIRED by this system. Your admission is NOT complete
                without your Enrolment Code.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <TextField
            label="JHS Index Number"
            sx={{ mt: 4, width: "300px" }}
            size="small"
            onChange={(e) => setIndexNumber(e.target.value)}
          />

          <br />
          <Button
            onClick={handleLogin}
            variant="contained"
            color="primary"
            sx={{ mt: 1 }}
          >
            Submit
          </Button>
          <Snackbar
            anchorOrigin={{
              vertical: "top",
              horizontal: "center",
            }}
            open={open}
            autoHideDuration={6000}
            onClose={handleClose}
          >
            <Alert severity={"error"}>{message}</Alert>
          </Snackbar>
        </div>
      </Box>
    </>
  );
};

export default Login;

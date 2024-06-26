import React, { useState, useEffect } from "react";
import { styled } from "@mui/material/styles";
import ArrowForwardIosSharpIcon from "@mui/icons-material/ArrowForwardIosSharp";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning";
import MuiAccordion from "@mui/material/Accordion";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import { useNavigate } from "react-router-dom";
import { db } from "../helpers/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

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

const Home = () => {
  const [expanded, setExpanded] = useState("panel1");
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "school"));
        const fetchedSchools = [];
        querySnapshot.forEach((doc) => {
          fetchedSchools.push({ id: doc.id, ...doc.data() });
        });

        // Sort schools by name
        fetchedSchools.sort((a, b) => a.name.localeCompare(b.name));

        setSchools(fetchedSchools);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching schools:", error);
      }
    };

    fetchSchools();
  }, []);

  const handleSchoolSelect = async (event) => {
    const selectedId = event.target.value;
    const school = schools.find((s) => s.id === selectedId);

    try {
      const admissionQuery = query(
        collection(db, "admission"),
        where("schoolID", "==", selectedId)
      );
      const admissionSnapshot = await getDocs(admissionQuery);

      if (!admissionSnapshot.empty) {
        const admissionDoc = admissionSnapshot.docs[0];
        const admissionData = admissionDoc.data();
        console.log(admissionData);

      }
    } catch (error) {
      console.error("Error fetching admission data:", error);
    }

    setSelectedSchool(selectedId);
    navigate(`/login/${selectedId}`);
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
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
          WELCOME TO THE ONLINE SHS PLATFORM
        </Typography>

        <div>
          <Typography variant="p" sx={{ mb: 2, color: "#333" }}>
            "Welcome to our online admission platform for Senior High School!
            Our platform is designed to make the admission process seamless and
            efficient. <br /> <br />
            We developed this SHS Admission Portal. Instead of coming to the
            school for your SHS admissions process, use this Portal. You can use
            this portal to check and submit your placement documents, print your
            admission letter, prospectus and among other things. ONLY REPORT TO
            SCHOOL WHEN SCHOOL REOPENS...
          </Typography>{" "}
          <br />
          <TextField
            select
            label="Select your School"
            value={selectedSchool}
            onChange={handleSchoolSelect}
            sx={{ my: 4, width: "300px" }}
            size="small"
          >
            {schools.map((school) => (
              <MenuItem key={school.id} value={school.id}>
                <Box display="flex" alignItems="center">
                  <Avatar src={school.image} sx={{ marginRight: 2 }} />
                  {school.name}
                </Box>
              </MenuItem>
            ))}
          </TextField>
        </div>
      </Box>
      <NetworkStatusWarning />
    </>
  );
};

export default Home;

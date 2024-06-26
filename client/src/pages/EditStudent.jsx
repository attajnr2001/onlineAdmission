import React, { useState, useEffect } from "react";
import {
  TextField,
  Snackbar,
  Alert,
  MenuItem,
  Button,
  Avatar,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { motion, AnimatePresence } from "framer-motion";
import { Camera } from "@mui/icons-material";
import { useParams } from "react-router-dom";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning";

import {
  collection,
  getDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db, storage } from "../helpers/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {
  districts,
  regions,
  churches,
  validNationalities,
} from "../helpers/constants";
import "../styles/editStudent.css";
import { useNavigate } from "react-router-dom";

const EditStudent = () => {
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const { schoolID, studentID } = useParams();
  const [student, setStudent] = useState({});
  const [indexNumber, setIndexNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [aggregate, setAggregate] = useState("");
  const [program, setProgram] = useState({});
  const [house, setHouse] = useState({});
  const [houses, setHouses] = useState([]);
  const [selectedHouse, setSelectedHouse] = useState("");
  const [residentialStatus, setResidentialStatus] = useState("");
  const [rawScore, setRawScore] = useState("");
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [enrollmentForm, setEnrollmentForm] = useState("");
  const [jhsAttended, setJhsAttended] = useState("");
  const [jhsType, setJhsType] = useState("");
  const [photo, setPhoto] = useState("");
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [religion, setReligion] = useState("");
  const [religiousDenomination, setReligiousDenomination] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [town, setTown] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [interest, setInterest] = useState("");
  const [ghanaCardNumber, setGhanaCardNumber] = useState("");
  const [nHISNumber, setNHISNumber] = useState("");
  const [mobilePhone, setMobilePhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [otherPhone, setOtherPhone] = useState("");
  const [email, setEmail] = useState("");
  const [fathersName, setFathersName] = useState("");
  const [fathersOccupation, setFathersOccupation] = useState("");
  const [mothersName, setMothersName] = useState("");
  const [mothersOccupation, setMothersOccupation] = useState("");
  const [guardian, setGuardian] = useState("");
  const [residentialTelephone, setResidentialTelephone] = useState("");
  const [digitalAddress, setDigitalAddress] = useState("");
  const [nationality, setNationality] = useState("Ghana");
  const [, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState(null);
  const [, setPerc] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [admissionData, setAdmissionData] = useState({});
  const [showPersonalRecords, setShowPersonalRecords] = useState(false);
  const [photoUploaded, setPhotoUploaded] = useState(true); // New state to track photo upload
  const navigate = useNavigate();

  const toggleWidgets = () => {
    setShowPersonalRecords(!showPersonalRecords);
  };

  useEffect(() => {
    const fetchHouses = async () => {
      try {
        const housesQuery = query(
          collection(db, "houses"),
          where("gender", "==", student.gender),
          where("schoolID", "==", schoolID)
        );
        const housesSnapshot = await getDocs(housesQuery);
        const housesList = housesSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setHouses(housesList);
      } catch (error) {
        console.error("Error fetching houses:", error);
      }
    };

    fetchHouses();
  }, [student.gender, schoolID]);

  // find and fetch student data from students collection to populate the fields
  useEffect(() => {
    const fetchStudentData = async () => {
      const studentData = await getDoc(doc(db, `students/${studentID}`));
      setStudent(studentData.data());
      setIndexNumber(studentData.data().indexNumber);
      setFirstName(studentData.data().firstName);
      setLastName(studentData.data().lastName);
      setGender(studentData.data().gender);
      setResidentialStatus(studentData.data().status);
      setAggregate(studentData.data().aggregate);
      setPhoto(studentData.data().image);
      setEnrollmentForm(studentData.data().enrollmentForm);
      setRawScore(studentData.data().rawScore);
      setEnrollmentCode(studentData.data().enrollmentCode);
      setJhsAttended(studentData.data().jhsAttended);
      setJhsType(studentData.data().jhsType);
      setPlaceOfBirth(studentData.data().placeOfBirth);
      setDateOfBirth(studentData.data().dateOfBirth);
      setNationality(studentData.data().nationality);
      setReligion(studentData.data().religion);
      setReligiousDenomination(studentData.data().religiousDenomination || "");
      setPermanentAddress(studentData.data().permanentAddress);
      setTown(studentData.data().town);
      setRegion(studentData.data().region);
      setDistrict(studentData.data().district);
      setInterest(studentData.data().interest);
      setGhanaCardNumber(studentData.data().ghanaCardNumber);
      setNHISNumber(studentData.data().nHISNumber);
      setMobilePhone(studentData.data().mobilePhone);
      setWhatsappNumber(studentData.data().whatsappNumber);
      setOtherPhone(studentData.data().otherPhone);
      setEmail(studentData.data().email);
      setFathersName(studentData.data().fathersName);
      setFathersOccupation(studentData.data().fathersOccupation);
      setMothersName(studentData.data().mothersName);
      setMothersOccupation(studentData.data().mothersOccupation);
      setGuardian(studentData.data().guardian);
      setResidentialTelephone(studentData.data().residentialTelephone);
      setDigitalAddress(studentData.data().digitalAddress);
      setLoading(false);
      setSelectedHouse(studentData.data().house || "");

      // Fetch the program data
      const programID = studentData.data().program;
      const programData = await getDoc(doc(db, `programs/${programID}`));
      const houseID = studentData.data().house;
      const houseData = await getDoc(doc(db, `houses/${houseID}`));

      setProgram(programData.data());
      setHouse(houseData.data());
    };
    fetchStudentData();
  }, [studentID]);

  // uploading student profile picture in firestore
  const uploadImage = () => {
    if (file.size > 2 * 1024 * 1024) {
      setSnackbarMessage("File is too large. Maximum size is 2MB.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setFile(null);
      return;
    }

    setPhotoUploaded(false);

    const name = new Date().getTime() + file.name;
    const storageRef = ref(storage, name);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress);
        console.log("Upload is " + progress + "% done");
        setPerc(progress);
        setUploading(true);
        switch (snapshot.state) {
          case "paused":
            console.log("Upload is paused");
            break;
          case "running":
            console.log("Upload is running");
            break;
          default:
            break;
        }
      },
      (error) => {
        console.log(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setPhoto(downloadURL);
          setUploading(false);
          setPhotoUploaded(true); // Set photoUploaded to true when upload is complete
        });
      }
    );
  };

  // uploads enrollment form of student into the firestore
  const uploadForm = () => {
    const name = new Date().getTime() + form.name;
    const storageRef = ref(storage, name);
    const uploadTask = uploadBytesResumable(storageRef, form);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress);
        console.log("Upload form is " + progress + "% done");
        setPerc(progress);
        setUploading(true);
        switch (snapshot.state) {
          case "paused":
            console.log("Upload form is paused");
            break;
          case "running":
            console.log("Upload form is running");
            break;
          default:
            break;
        }
      },
      (error) => {
        console.log(error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setEnrollmentForm(downloadURL);
          setUploading(false);
        });
      }
    );
  };

  useEffect(() => {
    file && uploadImage();
  }, [file]);

  useEffect(() => {
    form && uploadForm();
  }, [form]);

  const getRandomHouseID = async (student, schoolID) => {
    try {
      let houseID = student.house;

      if (!houseID) {
        const housesQuery = query(
          collection(db, "houses"),
          where("gender", "==", student.gender),
          where("schoolID", "==", schoolID)
        );
        const housesSnapshot = await getDocs(housesQuery);
        const housesList = housesSnapshot.docs.map((doc) => doc.id);

        if (housesList.length === 0) {
          throw new Error("No available houses for the student's gender.");
        }

        houseID = housesList[Math.floor(Math.random() * housesList.length)];
      }

      return houseID;
    } catch (error) {
      console.error("Error getting random house ID:", error);
      throw error;
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);

      // Check if the student has paid else disallow saving
      if (!student.hasPaid) {
        setSnackbarMessage(
          "You must complete the payment before saving changes."
        );
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setIsSaving(false);
        return;
      }

      // Check if all required fields are filled
      if (
        !rawScore ||
        !enrollmentCode ||
        !enrollmentForm ||
        !jhsAttended ||
        !jhsType ||
        !photo ||
        !placeOfBirth ||
        !dateOfBirth ||
        !nationality ||
        !religion ||
        !permanentAddress ||
        !town ||
        !region ||
        !district ||
        !interest ||
        !ghanaCardNumber ||
        !mobilePhone ||
        !nHISNumber ||
        !fathersName ||
        !fathersOccupation ||
        !mothersName ||
        !mothersOccupation ||
        !guardian
      ) {
        setSnackbarMessage("Please fill in all required fields.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
        setIsSaving(false);
        return;
      }

      // Fetch houses collection and randomly select a house if not already assigned
      let houseID;
      if (selectedHouse) {
        houseID = selectedHouse;
      } else {
        houseID = await getRandomHouseID(student, schoolID);
      }

      // Save changes to students collection
      const studentRef = doc(db, `students/${studentID}`);
      await updateDoc(studentRef, {
        rawScore,
        enrollmentCode,
        enrollmentForm,
        jhsAttended,
        jhsType,
        image: photo,
        placeOfBirth,
        dateOfBirth,
        nationality,
        religion,
        religiousDenomination,
        permanentAddress,
        town,
        region,
        district,
        interest,
        ghanaCardNumber,
        nHISNumber,
        mobilePhone,
        whatsappNumber,
        otherPhone,
        email,
        fathersName,
        fathersOccupation,
        mothersName,
        mothersOccupation,
        guardian,
        residentialTelephone,
        digitalAddress,
        house: houseID,
        completed: true,
      });

      setSnackbarMessage("Student details updated successfully.");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setTimeout(() => {
        navigate(`/dashboard/${schoolID}/${studentID}`);
      }, 2000);
    } catch (error) {
      console.error("Error updating student details:", error);
      setSnackbarMessage("Failed to update student details. Please try again.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setIsSaving(false);
    }
  };

  // fetch admission data to check contraints
  useEffect(() => {
    const fetchAdmissionData = async () => {
      try {
        const admissionRef = collection(db, "admission");
        const q = query(admissionRef, where("schoolID", "==", schoolID));
        const querySnapshot = await getDocs(q);
        const admissionData = querySnapshot.docs[0].data();
        setAdmissionData(admissionData);
      } catch (error) {
        console.error("Error fetching admission data:", error);
      }
    };
    fetchAdmissionData();
  }, [schoolID]);

  return (
    <div className="edit-student">
      <p className="title">
        PREVIOUS DETAILS{"  "}
        <IconButton onClick={toggleWidgets} sx={{ p: 0 }}>
          {showPersonalRecords ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
      </p>
      <form className="edit-form">
        <AnimatePresence>
          {showPersonalRecords && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <TextField
                required
                label="Index Number"
                variant="outlined"
                fullWidth
                margin="normal"
                disabled
                value={indexNumber}
                onChange={(e) => setIndexNumber(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                required
                label="Gender"
                name="gender"
                select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                fullWidth
                margin="normal"
                disabled
                InputLabelProps={{
                  shrink: true,
                }}
              >
                {["MALE", "FEMALE"].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                required
                label="Program"
                variant="outlined"
                fullWidth
                margin="normal"
                disabled
                value={program.name}
                onChange={(e) => setProgram(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                required
                label="Residential Status"
                variant="outlined"
                fullWidth
                margin="normal"
                disabled
                value={residentialStatus}
                onChange={(e) => setResidentialStatus(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
              <TextField
                required
                label="Last Name"
                variant="outlined"
                fullWidth
                margin="normal"
                disabled
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              <TextField
                required
                label="Other Names"
                variant="outlined"
                fullWidth
                margin="normal"
                disabled
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              <TextField
                required
                label="Aggregate of Best 6"
                variant="outlined"
                fullWidth
                margin="normal"
                disabled
                value={aggregate}
                onChange={(e) => setAggregate(e.target.value)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <p className="title">ENROLLMENT DETAILS</p>
        <TextField
          type="number"
          required
          label="Raw Score"
          variant="outlined"
          value={rawScore}
          onChange={(e) => setRawScore(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          required
          label="Enrollment Code"
          value={enrollmentCode}
          onChange={(e) => setEnrollmentCode(e.target.value)}
          variant="outlined"
          fullWidth
          margin="normal"
        />
        <TextField
          required
          label="Enrollment Form"
          variant="outlined"
          type="file"
          fullWidth
          margin="normal"
          src={enrollmentForm || ""}
          onChange={(e) => setForm(e.target.files[0])}
          InputLabelProps={{
            shrink: true,
          }}
        />
        <a
          href={enrollmentForm}
          download
          target="_blank"
          style={{
            fontSize: "smaller",
            color: "blue",
          }}
        >
          Download Enrollment Form
        </a>

        <TextField
          required
          label="JHS Attended"
          variant="outlined"
          fullWidth
          margin="normal"
          value={jhsAttended}
          onChange={(e) => setJhsAttended(e.target.value)}
        />

        <TextField
          required
          label="JHS Type"
          name="jhsType"
          select
          value={jhsType}
          onChange={(e) => setJhsType(e.target.value)}
          fullWidth
          margin="normal"
        >
          {["Public", "Private"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <p className="title">PERSONAL RECORDS</p>

        {admissionData.autoStudentHousing ? (
          <TextField
            label="House"
            name="house"
            select
            value={selectedHouse}
            onChange={(e) => setSelectedHouse(e.target.value)}
            fullWidth
            margin="normal"
          >
            {houses.map((house) => (
              <MenuItem key={house.id} value={house.id}>
                {house.name}
              </MenuItem>
            ))}
          </TextField>
        ) : null}

        {admissionData.allowUploadPictures ? (
          <div>
            <Avatar
              sx={{ width: "100px", height: "100px", marginBottom: "10px" }}
              src={photo || ""}
              alt="Student Photo"
            />
            <input
              accept="image/*"
              id="icon-button-file"
              type="file"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files[0])}
            />
            <label htmlFor="icon-button-file">
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
              >
                <Camera />
              </IconButton>
            </label>
          </div>
        ) : null}
        <TextField
          required
          label="Place of Birth"
          variant="outlined"
          fullWidth
          margin="normal"
          value={placeOfBirth}
          onChange={(e) => setPlaceOfBirth(e.target.value)}
        />

        <TextField
          required
          label="Date of Birth"
          type="date"
          fullWidth
          margin="normal"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          InputLabelProps={{
            shrink: true,
          }}
        />

        <TextField
          label="Nationality"
          select
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          fullWidth
          margin="normal"
        >
          {validNationalities.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          required
          label="Religion"
          name="religion"
          select
          value={religion}
          onChange={(e) => setReligion(e.target.value)}
          fullWidth
          margin="normal"
        >
          {["Christianity", "Islamic", "Tradionalist", "Atheist", "Other"].map(
            (option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            )
          )}
        </TextField>

        <TextField
          required
          label="Religious Denomination"
          name="religiousDenomination"
          select
          value={religiousDenomination}
          onChange={(e) => setReligiousDenomination(e.target.value)}
          fullWidth
          margin="normal"
          disabled={religion !== "Christianity"}
          helperText={
            religion !== "Christianity" ? "Only applicable for Christians" : ""
          }
        >
          {churches.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          required
          label="Permanent Address"
          variant="outlined"
          fullWidth
          margin="normal"
          value={permanentAddress}
          onChange={(e) => setPermanentAddress(e.target.value)}
        />

        <TextField
          required
          label="Town"
          variant="outlined"
          fullWidth
          margin="normal"
          value={town}
          onChange={(e) => setTown(e.target.value)}
        />

        <TextField
          required
          label="Region"
          name="region"
          select
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          fullWidth
          margin="normal"
        >
          {regions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          required
          label="District"
          name="district"
          select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          fullWidth
          margin="normal"
        >
          {districts.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          required
          label="Interest"
          name="interest"
          select
          fullWidth
          margin="normal"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
        >
          {["Football", "Drama", "Quiz"].map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          type="number"
          required
          label="Ghana Card Number"
          variant="outlined"
          fullWidth
          margin="normal"
          value={ghanaCardNumber}
          onChange={(e) => setGhanaCardNumber(e.target.value)}
        />

        <TextField
          type="number"
          required
          label="NHIS Number"
          variant="outlined"
          fullWidth
          margin="normal"
          value={nHISNumber}
          onChange={(e) => setNHISNumber(e.target.value)}
        />

        <p className="title">COMMUNICATIONS DETAILS</p>
        <TextField
          required
          label="Mobile Phone (SMS)"
          variant="outlined"
          fullWidth
          margin="normal"
          value={mobilePhone}
          onChange={(e) => setMobilePhone(e.target.value)}
        />
        <TextField
          required
          label="WhatsApp Number"
          variant="outlined"
          fullWidth
          margin="normal"
          value={whatsappNumber}
          onChange={(e) => setWhatsappNumber(e.target.value)}
        />
        <TextField
          required
          label="Other Phone"
          variant="outlined"
          fullWidth
          margin="normal"
          value={otherPhone}
          onChange={(e) => setOtherPhone(e.target.value)}
        />
        <TextField
          required
          label="Email"
          variant="outlined"
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          required
          label="Father's Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={fathersName}
          onChange={(e) => setFathersName(e.target.value)}
        />
        <TextField
          required
          label="Father's Occupation"
          variant="outlined"
          fullWidth
          margin="normal"
          value={fathersOccupation}
          onChange={(e) => setFathersOccupation(e.target.value)}
        />
        <TextField
          required
          label="Mother's Name"
          variant="outlined"
          fullWidth
          margin="normal"
          value={mothersName}
          onChange={(e) => setMothersName(e.target.value)}
        />
        <TextField
          required
          label="Mother's Occupation"
          variant="outlined"
          fullWidth
          margin="normal"
          value={mothersOccupation}
          onChange={(e) => setMothersOccupation(e.target.value)}
        />
        <TextField
          required
          label="Guardian"
          variant="outlined"
          fullWidth
          margin="normal"
          value={guardian}
          onChange={(e) => setGuardian(e.target.value)}
        />
        <TextField
          required
          type="number"
          label="Residential Telephone"
          variant="outlined"
          fullWidth
          margin="normal"
          value={residentialTelephone}
          onChange={(e) => setResidentialTelephone(e.target.value)}
        />
        <TextField
          required
          label="Digital Address"
          variant="outlined"
          fullWidth
          margin="normal"
          value={digitalAddress}
          onChange={(e) => setDigitalAddress(e.target.value)}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveChanges}
          disabled={isSaving || !photoUploaded}
          sx={{ mb: 3 }}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      <Snackbar
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity={snackbarSeverity}>{snackbarMessage}</Alert>
      </Snackbar>
      <NetworkStatusWarning />
    </div>
  );
};

export default EditStudent;

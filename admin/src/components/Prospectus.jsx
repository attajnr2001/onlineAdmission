import React, { useState, useEffect } from "react";
import { Button, Input, Alert, AlertTitle } from "@mui/material";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { db, storage, auth } from "../helpers/firebase";
import { useLocationIP, getPlatform } from "../helpers/utils";

const Prospectus = () => {
  const { schoolID } = useParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [prospectusURL, setProspectusURL] = useState(null);
  const locationIP = useLocationIP();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  const resetSuccessMessage = () => {
    setTimeout(() => {
      setSuccessMessage(null);
    }, 5000); // Reset the success message after 5 seconds
  };

  useEffect(() => {
    const fetchProspectusURL = async () => {
      try {
        const admissionRef = collection(db, "admission");
        const q = query(admissionRef, where("schoolID", "==", schoolID));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const prospectus = doc.data().prospectus;
          setProspectusURL(prospectus);
        });

        const unsubscribe = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "modified") {
              const prospectus = change.doc.data().prospectus;
              setProspectusURL(prospectus);
            }
          });
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching prospectus URL:", error);
        setUploadError("Error fetching prospectus URL");
      }
    };

    fetchProspectusURL();
  }, [schoolID]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type !== "application/pdf") {
      setUploadError("Please select a PDF file.");
      setSelectedFile(null);
    } else {
      setUploadError(null);
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file.");
      return;
    }

    setLoading(true); // Set loading state to true before upload

    try {
      const currentUser = auth.currentUser;

      const storageRef = ref(
        storage,
        `${new Date().getTime()}${selectedFile.name}`
      );

      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      uploadTask.on(
        "state_changed",
        (snapshot) => {},
        (error) => {
          console.error("Error uploading file:", error);
          setUploadError("Error uploading file. Please try again.");
          setLoading(false); // Set loading state back to false on error
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(storageRef);
            setUploadError(null);
            console.log(
              "File uploaded successfully. Download URL:",
              downloadURL
            );

            const admissionRef = collection(db, "admission");
            const q = query(admissionRef, where("schoolID", "==", schoolID));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(async (doc) => {
              await updateDoc(doc.ref, { prospectus: downloadURL });
              setSuccessMessage("Prospectus file uploaded successfully.");
              resetSuccessMessage(); // Reset the success message after 5 seconds
            });

            // Fetch current datetime from World Time API
            const response = await fetch(
              "http://worldtimeapi.org/api/timezone/Africa/Accra"
            );
            const data = await response.json();
            const dateTimeString = data.datetime;
            const dateTimeParts = dateTimeString.split(/[+\-]/);
            const dateTime = new Date(
              `${dateTimeParts[0]} UTC${dateTimeParts[1]}`
            );
            // Subtract one hour from the datetime
            dateTime.setHours(dateTime.getHours() - 1);

            // Log the addition of a new house
            const logsCollection = collection(db, "logs");
            await addDoc(logsCollection, {
              action: `Prospectus File Updated`,
              actionDate: dateTime,
              adminID: currentUser.email,
              locationIP: locationIP || "",
              platform: getPlatform(),
              schoolID: schoolID,
            });

            setSelectedFile(null);
            setLoading(false); // Set loading state back to false on success
          } catch (error) {
            console.error("Error getting download URL:", error);
            setUploadError("Error getting download URL. Please try again.");
            setLoading(false); // Set loading state back to false on error
          }
        }
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError("Error uploading file. Please try again.");
      setLoading(false); // Set loading state back to false on error
    }
  };
  return (
    <div className="file">
      {prospectusURL && (
        <a href={prospectusURL} target="_blank" download>
          Download Prospectus
        </a>
      )}
      <p className="newFile">Upload New Prospectus File</p>
      <Input type="file" onChange={handleFileChange} sx={{ my: 1, mr: 1 }} />
      <Button
        variant="contained"
        onClick={handleUpload}
        size="small"
        sx={{ mb: 2 }}
        disabled={!selectedFile || loading}
      >
        Save
      </Button>
      <br />
      {uploadError && <Alert severity="error">{uploadError}</Alert>}
      {successMessage && (
        <Alert severity="success">
          <AlertTitle>Success</AlertTitle>
          {successMessage}
        </Alert>
      )}
    </div>
  );
};

export default Prospectus;

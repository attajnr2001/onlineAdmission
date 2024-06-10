import React, { useState, useEffect } from "react";
import { Button, Input, Alert, Snackbar } from "@mui/material";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useParams } from "react-router-dom";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component
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

const Undertaking = () => {
  const { schoolID } = useParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [undertakingURL, setUndertakingURL] = useState(null);
  const [loading, setLoading] = useState(false);
  const locationIP = useLocationIP();
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    const fetchUndertakingURL = async () => {
      try {
        const admissionRef = collection(db, "admission");
        const q = query(admissionRef, where("schoolID", "==", schoolID));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const undertaking = doc.data().undertaking;
          setUndertakingURL(undertaking);
        });

        const unsubscribe = onSnapshot(q, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "modified") {
              const undertaking = change.doc.data().undertaking;
              setUndertakingURL(undertaking);
            }
          });
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching undertaking URL:", error);
        setUploadError("Error fetching undertaking URL");
      }
    };

    fetchUndertakingURL();
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
              await updateDoc(doc.ref, { undertaking: downloadURL });
              console.log("Undertaking URL updated in admission document.");
            });

            // Log the addition of a new undertaking file
            const logsCollection = collection(db, "logs");
            await addDoc(logsCollection, {
              action: `Undertaking File Updated`,
              actionDate: new Date(),
              adminID: currentUser.email,
              schoolID: schoolID,
              locationIP: locationIP || "",
              platform: getPlatform(),
            });

            setSelectedFile(null);
            setLoading(false); // Set loading state back to false on success
            setSuccessMessage("File uploaded successfully.");
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

  const handleCloseSnackbar = () => {
    setSuccessMessage("");
  };

  return (
    <div className="file">
      {undertakingURL && (
        <a href={undertakingURL} target="_blank" download>
          Download Undertaking
        </a>
      )}
      <p className="newFile">Upload New Undertaking File</p>
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
      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity="success"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
      <NetworkStatusWarning/>
    </div>
  );
};

export default Undertaking;

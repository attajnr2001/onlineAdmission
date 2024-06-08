import React, { useState, useEffect } from "react";
import { Button, Input, Alert } from "@mui/material";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db, storage } from "../helpers/firebase";

const Undertaking = () => {
  const { schoolID } = useParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [undertakingURL, setUndertakingURL] = useState(null);

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

    try {
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

            setSelectedFile(null);
          } catch (error) {
            console.error("Error getting download URL:", error);
            setUploadError("Error getting download URL. Please try again.");
          }
        }
      );
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadError("Error uploading file. Please try again.");
    }
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
        disabled={!selectedFile}
      >
        Save
      </Button>
      <br />
      {uploadError && <Alert severity="error">{uploadError}</Alert>}
    </div>
  );
};

export default Undertaking;

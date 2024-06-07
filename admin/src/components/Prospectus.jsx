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

const Prospectus = () => {
  const { schoolID } = useParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [prospectusURL, setProspectusURL] = useState(null);

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
    setSelectedFile(event.target.files[0]);
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
              await updateDoc(doc.ref, { prospectus: downloadURL });
              console.log("Prospectus URL updated in admission document.");
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
      {prospectusURL && (
        <a href={prospectusURL} target="_blank" download>
          Download Prospectus
        </a>
      )}
      <p className="newFile">Upload New Prospectus File</p>
      <Input type="file" onChange={handleFileChange} sx={{ my: 1, mr: 1 }} />
      <Button variant="contained" onClick={handleUpload} size="small" sx={{mb: 2}}>
        Save
      </Button>
      <br />
      {uploadError && <Alert severity="error">{uploadError}</Alert>}
    </div>
  );
};

export default Prospectus;

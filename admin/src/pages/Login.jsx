import { useContext, useState, useEffect } from "react";
import { auth, db } from "../helpers/firebase";
import { AuthContext } from "../context/AuthContext";
import { signInWithEmailAndPassword } from "firebase/auth";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import {
  Button,
  InputAdornment,
  Snackbar,
  IconButton,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff, Person, Close } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import Grid from "@mui/material/Grid";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [locationIP, setLocationIP] = useState("");

  useEffect(() => {
    const fetchLocationIP = async () => {
      try {
        const response = await fetch("https://api64.ipify.org?format=json");
        const data = await response.json();
        setLocationIP(data.ip);
      } catch (error) {
        console.error("Error fetching location IP:", error);
      }
    };

    fetchLocationIP(); // Call the function when component mounts
  }, []); // Empty dependency array to run only once

  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const getPlatform = () => {
    const userAgent = navigator.userAgent;
    if (/Mobi|Android/i.test(userAgent)) {
      return "mobile";
    } else if (/Tablet|iPad/i.test(userAgent)) {
      return "tablet";
    } else {
      return "desktop";
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const adminCollection = collection(db, "admin");
      const q = query(adminCollection, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      let schoolID = null;
      let isAdminActive = true; // Initialize a variable to check if admin is active

      querySnapshot.forEach((doc) => {
        schoolID = doc.data().schoolID;
        isAdminActive = doc.data().active; // Check the 'active' field in admin document
      });

      if (!isAdminActive) {
        throw new Error("Your credentials are deactivated."); // Throw an error if admin is not active
      }

      await addDoc(collection(db, "logs"), {
        action: "login",
        actionDate: new Date(),
        adminID: user.email,
        locationIP: locationIP,
        platform: getPlatform(),
        schoolID: schoolID,
      });

      dispatch({ type: "LOGIN", payload: user });
      navigate(`/admin/dashboard/${schoolID}/placement-actions`);
    } catch (error) {
      console.error("Error signing in:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ height: "95vh" }}>
      <Grid
        container
        spacing={2}
        direction="column"
        alignItems="center"
        justifyContent="center"
        style={{ minHeight: "100vh" }}
      >
        <Grid item>
          <Typography
            variant="h5"
            component="h5"
            gutterBottom
            sx={{ fontWeight: "bold", color: "#333" }}
          >
            LOGIN
          </Typography>
        </Grid>
        <Grid item>
          <TextField
            size="small"
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end">
                    <Person />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item>
          <TextField
            size="small"
            label="Password"
            variant="outlined"
            fullWidth
            margin="normal"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Button
          variant="contained"
          color="primary"
          onClick={handleLogin}
          sx={{ marginBottom: "10px" }}
          disabled={loading}
        >
          {loading ? "Logging In..." : "Login"}
        </Button>
        <Snackbar
          open={error}
          autoHideDuration={6000}
          onClose={() => setError(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="error">Invalid credentials, Please Try Again</Alert>
        </Snackbar>
      </Grid>
    </Container>
  );
};

export default Login;

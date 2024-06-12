import { useContext, useState } from "react";
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
import { Visibility, VisibilityOff, Person } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import Grid from "@mui/material/Grid";
import { useLocationIP, getPlatform } from "../helpers/utils";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const locationIP = useLocationIP();

  const { dispatch } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

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

      const response = await fetch(
        "http://worldtimeapi.org/api/timezone/Africa/Accra"
      );
      const data = await response.json();
      const dateTimeString = data.datetime;
      console.log(dateTimeString);

      await addDoc(collection(db, "logs"), {
        action: "login",
        actionDate: dateTimeString,
        adminID: user.email,
        locationIP: locationIP,
        platform: getPlatform(),
        schoolID: schoolID,
      });

      dispatch({ type: "LOGIN", payload: user });
      navigate(`/admin/dashboard/${schoolID}/placement-actions`);
    } catch (error) {
      console.error("Error signing in:", error);
      setError(error.message);
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
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError("")}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert severity="error">{error}</Alert>
        </Snackbar>
        <NetworkStatusWarning /> {/* Use the component here */}
      </Grid>
    </Container>
  );
};

export default Login;

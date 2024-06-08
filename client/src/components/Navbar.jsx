import React, { useState, useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Slide from "@mui/material/Slide";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import { Box } from "@mui/system";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useParams, NavLink, Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import { db } from "../helpers/firebase";
import { doc, onSnapshot } from "firebase/firestore";

const HideOnScroll = (props) => {
  const { children } = props;
  const trigger = useScrollTrigger();

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  );
};

const Navbar = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [schoolName, setSchoolName] = useState(null);
  const [schoolImage, setSchoolImage] = useState(null);
  const { schoolID, studentID } = useParams();

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
    if (!studentID) return;

    const studentDocRef = doc(db, "students", studentID);
    const unsubscribe = onSnapshot(studentDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const studentData = docSnapshot.data();
        setSchoolName(studentData.schoolName);
      } else {
        console.log("Student document not found");
      }
    });

    return () => unsubscribe();
  }, [studentID]);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <HideOnScroll>
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: "white",
            color: "black",
            whiteSpace: "nowrap",
          }}
        >
          <Toolbar>
            <Typography variant="h6" sx={{ fontWeight: "bold", flexGrow: 1 }}>
              ONLINE ADMISSION
            </Typography>
            <Box sx={{ display: { xs: "none", md: "flex" }, gap: "10px" }}>
              {studentID ? (
                <>
                  <Button
                    component={NavLink}
                    to={`/dashboard/${schoolID}/${studentID}`}
                    sx={{ color: "black" }}
                    className={({ isActive }) =>
                      isActive ? "nav-link-active" : "nav-link"
                    }
                  >
                    DASHBOARD
                  </Button>
                  <Button
                    component={NavLink}
                    to={`/dashboard/${schoolID}/${studentID}/edit-student`}
                    sx={{ color: "black" }}
                    className={({ isActive }) =>
                      isActive ? "nav-link-active" : "nav-link"
                    }
                  >
                    EDIT STUDENT
                  </Button>
                  <Button
                    component={NavLink}
                    to={``}
                    sx={{ color: "black" }}
                    className={({ isActive }) =>
                      isActive ? "nav-link-active" : "nav-link"
                    }
                  >
                    LOGOUT
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    component={NavLink}
                    to="/"
                    sx={{ color: "black" }}
                    className={({ isActive }) =>
                      isActive ? "nav-link-active" : "nav-link"
                    }
                  >
                    HOME
                  </Button>
                  <Button
                    component={NavLink}
                    to="/verify-payment"
                    sx={{ color: "black" }}
                    className={({ isActive }) =>
                      isActive ? "nav-link-active" : "nav-link"
                    }
                  >
                    VERIFY PAYMENT
                  </Button>
                  <Button
                    component={NavLink}
                    to="/contact"
                    sx={{ color: "black" }}
                    className={({ isActive }) =>
                      isActive ? "nav-link-active" : "nav-link"
                    }
                  >
                    CONTACT US
                  </Button>
                </>
              )}
            </Box>
            <IconButton
              sx={{ display: { xs: "block", md: "none" } }}
              color="inherit"
              aria-label="menu"
              onClick={handleMenuToggle}
              edge="start"
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <Drawer
        anchor="left"
        open={menuOpen}
        onClose={handleMenuToggle}
        sx={{ display: { xs: "block", md: "none" } }}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={handleMenuToggle}
          onKeyDown={handleMenuToggle}
        >
          <List>
            {studentID ? (
              <>
                <ListItemButton
                  component={NavLink}
                  to={`/dashboard/${schoolID}/${studentID}`}
                  sx={(theme) => ({
                    "&.nav-link-active": {
                      backgroundColor: theme.palette.action.selected,
                    },
                  })}
                >
                  <ListItemText primary="DASHBOARD" />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to={`/dashboard/${schoolID}/${studentID}/edit-student`}
                  sx={(theme) => ({
                    "&.nav-link-active": {
                      backgroundColor: theme.palette.action.selected,
                    },
                  })}
                >
                  <ListItemText primary="EDIT STUDENT" />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to={``}
                  sx={(theme) => ({
                    "&.nav-link-active": {
                      backgroundColor: theme.palette.action.selected,
                    },
                  })}
                >
                  <ListItemText primary="LOGOUT" />
                </ListItemButton>
              </>
            ) : (
              <>
                <ListItemButton
                  component={NavLink}
                  to="/"
                  sx={(theme) => ({
                    "&.nav-link-active": {
                      backgroundColor: theme.palette.action.selected,
                    },
                  })}
                >
                  <ListItemText primary="HOME" />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to="/verify-payment"
                  sx={(theme) => ({
                    "&.nav-link-active": {
                      backgroundColor: theme.palette.action.selected,
                    },
                  })}
                >
                  <ListItemText primary="VERIFY PAYMENT" />
                </ListItemButton>
                <ListItemButton
                  component={NavLink}
                  to="/contact"
                  sx={(theme) => ({
                    "&.nav-link-active": {
                      backgroundColor: theme.palette.action.selected,
                    },
                  })}
                >
                  <ListItemText primary="CONTACT US" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default Navbar;

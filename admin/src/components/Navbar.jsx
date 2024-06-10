import React, { useState, useContext, useEffect } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Slide from "@mui/material/Slide";
import useScrollTrigger from "@mui/material/useScrollTrigger";
import Avatar from "@mui/material/Avatar";
import { Box } from "@mui/system";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import Menu from "@mui/material/Menu";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import { AuthContext } from "../context/AuthContext";
import { doc, onSnapshot, addDoc, collection } from "firebase/firestore";
import { db, auth } from "../helpers/firebase";
import ChangePassword from "../mod/ChangePassword";
import { useParams } from "react-router-dom";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import NetworkStatusWarning from "../helpers/NetworkStatusWarning"; // Import the component
import "../styles/navbar.css";
import CircularProgress from "@mui/material/CircularProgress";

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
  const { currentUser, dispatch } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);
  const [placementOpen, setPlacementOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [openChangePassword, setOpenChangePassword] = useState(false);
  const [schoolName, setSchoolName] = useState(null);
  const [schoolImage, setSchoolImage] = useState(null);
  const { schoolID } = useParams();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const resetMenuState = () => {
    setDashboardOpen(false);
    setUtilitiesOpen(false);
    setPlacementOpen(false);
    setActionsOpen(false);
    setMenuAnchor(null);
  };

  useEffect(() => {
    resetMenuState();
  }, []);

  useEffect(() => {
    if (!schoolID) return; // Early return if schoolID is not available

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

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true); // Set the loading state to true before starting the logout process

      // Fetch the location IP
      let locationIP = "unknown";
      try {
        const response = await fetch("https://api64.ipify.org?format=json");
        const data = await response.json();
        locationIP = data.ip;
      } catch (fetchError) {
        console.error("Failed to fetch location IP:", fetchError);
      }

      // Log the logout action before signing out
      await addDoc(collection(db, "logs"), {
        action: "logout",
        actionDate: new Date(),
        adminID: currentUser.email,
        locationIP: locationIP,
        platform: getPlatform(),
        schoolID: schoolID,
      });

      // Sign out the user
      await signOut(auth);
      dispatch({ type: "LOGOUT" });
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false); // Set the loading state to false after the logout process is complete
    }
  };

  const handleDashboardClick = () => {
    setDashboardOpen(!dashboardOpen);
  };

  const handleUtilitiesClick = () => {
    setUtilitiesOpen(!utilitiesOpen);
  };

  const handlePlacementClick = () => {
    setPlacementOpen(!placementOpen);
  };

  const handleActionsClick = () => {
    setActionsOpen(!actionsOpen);
  };

  const handleMenuOpen = (event) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleOpenChangePassword = () => {
    setOpenChangePassword(true);
  };
  const handleCloseChangePassword = () => {
    setOpenChangePassword(false);
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
            <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {currentUser ? (
                <>
                  <IconButton
                    color="inherit"
                    aria-label="menu"
                    onClick={handleMenuOpen}
                    edge="start"
                  >
                    <MenuIcon />
                  </IconButton>
                  <Menu
                    id="menu-appbar"
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={handleMenuClose}
                  >
                    <List sx={{ whiteSpace: "nowrap" }}>
                      <ListItemButton onClick={handleDashboardClick} divider>
                        <ListItemText secondary="DASHBOARD" />
                        {dashboardOpen}
                      </ListItemButton>

                      <ListItemButton onClick={handleUtilitiesClick}>
                        <ListItemText secondary="UTILITIES" />
                        {utilitiesOpen ? <ExpandLess /> : <ExpandMore />}
                      </ListItemButton>
                      <Collapse in={utilitiesOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <ListItemText
                              primary="Change Password"
                              sx={{ fontWeight: "bold" }}
                              onClick={handleOpenChangePassword}
                            />

                            <ChangePassword
                              open={openChangePassword}
                              onOpen={handleOpenChangePassword}
                              onClose={handleCloseChangePassword}
                            />
                          </ListItemButton>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <NavLink to={`dashboard/${schoolID}/user-setup`}>
                              <ListItemText primary="User Setup" />
                            </NavLink>
                          </ListItemButton>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <NavLink
                              to={`dashboard/${schoolID}/admin-config/edit-sch-details`}
                            >
                              <ListItemText primary="Admission Config" />
                            </NavLink>
                          </ListItemButton>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <NavLink to={`dashboard/${schoolID}/houses`}>
                              <ListItemText primary="Houses" />
                            </NavLink>
                          </ListItemButton>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <NavLink to={`dashboard/${schoolID}/programs`}>
                              <ListItemText primary="Programs" />
                            </NavLink>
                          </ListItemButton>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <NavLink to={`dashboard/${schoolID}/admin-docs`}>
                              <ListItemText primary="Admission Docs" />
                            </NavLink>
                          </ListItemButton>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <NavLink to={`dashboard/${schoolID}/logs`}>
                              <ListItemText primary="Logs" />
                            </NavLink>
                          </ListItemButton>
                        </List>
                      </Collapse>
                      <ListItemButton onClick={handlePlacementClick}>
                        <ListItemText secondary="PLACEMENT" />
                        {placementOpen ? <ExpandLess /> : <ExpandMore />}
                      </ListItemButton>
                      <Collapse in={placementOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <NavLink
                              to={`dashboard/${schoolID}/placement-actions`}
                            >
                              <ListItemText primary="Manage CSSPS List" />
                            </NavLink>
                          </ListItemButton>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <NavLink to={`dashboard/${schoolID}/view-students`}>
                              <ListItemText primary="View Students" />
                            </NavLink>
                          </ListItemButton>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <NavLink
                              to={`dashboard/${schoolID}/manage-student`}
                            >
                              <ListItemText primary="Manage Students" />
                            </NavLink>
                          </ListItemButton>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <NavLink
                              to={`dashboard/${schoolID}/house-allocations`}
                            >
                              <ListItemText primary="House Allocations" />
                            </NavLink>
                          </ListItemButton>
                        </List>
                      </Collapse>
                      <ListItemButton onClick={handleActionsClick}>
                        <ListItemText secondary="ACTIONS" />
                        {actionsOpen ? <ExpandLess /> : <ExpandMore />}
                      </ListItemButton>
                      <Collapse in={actionsOpen} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <NavLink
                              to={`dashboard/${schoolID}/delete-database`}
                            >
                              <ListItemText primary="Delete Database" />
                            </NavLink>
                          </ListItemButton>
                          <ListItemButton sx={{ pl: 4 }} dense>
                            <ListItemText
                              primary={
                                isLoggingOut ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  "Logout"
                                )
                              }
                              sx={{ fontWeight: "bold" }}
                              onClick={isLoggingOut ? undefined : handleLogout}
                            />
                          </ListItemButton>
                        </List>
                      </Collapse>
                    </List>
                  </Menu>
                  <Avatar
                    alt="User Avatar"
                    src={schoolImage}
                    sx={{ width: 30, height: 30 }}
                  />
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  component={Link}
                  to="/login"
                >
                  Login
                </Button>
              )}
            </Box>
          </Toolbar>
        </AppBar>
      </HideOnScroll>
      <NetworkStatusWarning />
    </>
  );
};

export default Navbar;

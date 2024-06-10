import React from "react";
import { Snackbar, Alert, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import useNetworkStatus from "./useNetworkStatus";

const NetworkStatusWarning = () => {
  const { showNetworkWarning, setShowNetworkWarning } = useNetworkStatus();

  const handleClose = () => {
    setShowNetworkWarning(false);
  };

  return (
    <Snackbar
      open={showNetworkWarning}
      autoHideDuration={6000}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      onClose={handleClose}
    >
      <Alert
        severity="warning"
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <Close fontSize="inherit" />
          </IconButton>
        }
        onClose={handleClose}
      >
        Your network connection is weak or you are offline. Please check your
        connection.
      </Alert>
    </Snackbar>
  );
};

export default NetworkStatusWarning;

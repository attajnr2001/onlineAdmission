import { Box, Typography, Button } from "@mui/material";
import { Link } from "react-router-dom";
import React from "react";

const Welcome = () => {
  return (
    <Box
      sx={{
        minHeight: "85vh",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: 3,
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ textTransform: "uppercase", fontWeight: "bold", color: "#333" }}
      >
        Welcome to the SHS Online Admission Portal
      </Typography>
      <Typography variant="body1" sx={{ maxWidth: "600px", margin: "0 auto" }}>
        We are delighted to have you on board for the Senior High School online
        admission process. Our platform is designed to provide you with a
        seamless and efficient experience as you navigate through the
        application and admission stages. Whether you are here to apply for a
        new admission, check the status of your application, or manage other
        administrative tasks, our system is equipped to assist you at every
        step. Should you need any support, do not hesitate to reach out to our
        help desk. Thank you for choosing our platform, and we look forward to
        supporting your educational journey.
      </Typography>
      <Button
        color="primary"
        variant="contained"
        component={Link}
        to="/login"
        sx={{ my: 3 }}
      >
        Login
      </Button>
    </Box>
  );
};

export default Welcome;

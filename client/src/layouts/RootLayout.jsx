import React from "react";
import { Outlet } from "react-router-dom";
import { Box, Container, Typography } from "@mui/material";
import Navbar from "../components/Navbar";
import { useParams } from "react-router-dom";

const RootLayout = () => {
  const { schoolID } = useParams();
  return (
    <div>
      <Navbar />
      <Box sx={{ marginBottom: "5em" }}></Box>
      <Container>
        <Outlet />

        <Box
          component="footer"
          sx={{
            py: 2,
            px: 2,
            mt: "auto",
            backgroundColor: (theme) =>
              theme.palette.mode === "light"
                ? theme.palette.grey[200]
                : theme.palette.grey[800],
            textAlign: "center",
          }}
        >
          <Typography variant="body2" color="textSecondary">
            © {new Date().getFullYear()} Online SHS Platform. All rights
            reserved. Helplines: 0555225561, 0503539089, attajnr731@gmail.com
          </Typography>
        </Box>
      </Container>
    </div>
  );
};

export default RootLayout;

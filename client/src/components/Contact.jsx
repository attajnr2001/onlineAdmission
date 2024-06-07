import React from "react";
import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "left",
  color: theme.palette.text.secondary,
}));

const Contact = () => {
  return (
    <Box sx={{ flexGrow: 1, my: 2, minHeight: "80vh" }}>
      <Typography
        variant="h6"
        sx={{ fontWeight: "bold", color: "#333", my: 2 }}
      >
        CONTACT INFORMATION
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Item>
            <Typography
              variant="p"
              sx={{ fontWeight: "bold", color: "#333", my: 2 }}
            >
              Name: ONLINE ADMISSION
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12}>
          <Item>
            <Typography
              variant="p"
              sx={{ fontWeight: "bold", color: "#333", my: 2 }}
            >
              Location: AKIM ODA OPPOSITE ABSA BANK
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12}>
          <Item>
            <Typography
              variant="p"
              sx={{ fontWeight: "bold", color: "#333", my: 2 }}
            >
              Email: ATTAJNR731@GMAIL.COM
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12}>
          <Item>
            <Typography
              variant="p"
              sx={{ fontWeight: "bold", color: "#333", my: 2 }}
            >
              Phone: +233 50 353 9089
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12}>
          <Item>
            <Typography
              variant="p"
              sx={{ fontWeight: "bold", color: "#333", my: 2 }}
            >
              Whatsapp: +233 55 522 5561
            </Typography>
          </Item>
        </Grid>
        <Grid item xs={12}>
          <Item>
            <Typography
              variant="p"
              sx={{ fontWeight: "bold", color: "#333", my: 2 }}
            >
              CTO: AGYAPONG ATTA JUNIOR
            </Typography>
          </Item>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Contact;

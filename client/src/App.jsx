import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import RootLayout from "./layouts/RootLayout";
import theme from "./helpers/Theme";
import Welcome from "./pages/Welcome";
import Home from "./components/Home";
import VerifyPayment from "./components/VerifyPayment";
import Contact from "./components/Contact";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EditStudent from "./pages/EditStudent";
import MainLayout from "./layouts/MainLayout";

const App = () => {
  return (
    <>
      <ThemeProvider theme={theme}>
        <BrowserRouter>
          <Routes>
            <Route path="" element={<RootLayout />}>
              <Route path="" element={<Welcome />}>
                <Route index element={<Home />} />
                <Route path="verify-payment" element={<VerifyPayment />} />
                <Route path="contact" element={<Contact />} />
              </Route>
              <Route path="login/:schoolID" element={<Login />} />
              <Route
                path="dashboard/:schoolID/:studentID"
                element={<MainLayout />}
              >
                <Route index element={<Dashboard />} />
                <Route path="edit-student" element={<EditStudent />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </>
  );
};

export default App;

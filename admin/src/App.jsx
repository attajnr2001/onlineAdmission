import { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import theme from "./helpers/theme";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import RootLayout from "./layouts/RootLayout";
import AdminConfig from "./components/AdminConfig";
import EditSchoolDetails from "./components/EditSchoolDetails";
import EditAdmissionDetails from "./components/EditAdmissionDetails";
import EditStudentDetails from "./components/EditStudentDetails";
import Houses from "./components/Houses";
import Programs from "./components/Programs";
import AdmissionDocument from "./components/AdmissionDocument";
import Logs from "./components/Logs";
import PlacementActions from "./components/PlacementActions";
import ViewStudent from "./components/ViewStudent";
import UserSetup from "./components/UserSetup";
import ManageStudent from "./components/ManageStudent";
import DeleteDatabase from "./components/DeleteDatabase";
import HouseAllocations from "./components/HouseAllocations";
import Error from "./pages/Error";
import { AuthContext } from "./context/AuthContext";

const App = () => {
  const { currentUser } = useContext(AuthContext);

  const RequireAuth = ({ children }) => {
    return currentUser ? children : <Navigate to="/login" />;
  };

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootLayout />}>
            <Route index element={<Welcome />} />
            <Route path="login" element={<Login />} />
          </Route>
          <Route
            path="admin"
            element={
              // <RequireAuth>
                <RootLayout />
              // </RequireAuth>
            }
          >
            <Route path="dashboard/:schoolID" element={<Dashboard />}>
              <Route path="admin-config" element={<AdminConfig />}>
                <Route
                  path="edit-sch-details"
                  element={<EditSchoolDetails />}
                />
                <Route
                  path="edit-admission-details"
                  element={<EditAdmissionDetails />}
                />
                <Route
                  path="edit-student-dashboard"
                  element={<EditStudentDetails />}
                />
              </Route>
              <Route path="user-setup" element={<UserSetup />} />
              <Route path="houses" element={<Houses />} />
              <Route path="programs" element={<Programs />} />
              <Route path="admin-docs" element={<AdmissionDocument />} />
              <Route path="logs" element={<Logs />} />
              <Route path="placement-actions" element={<PlacementActions />} />
              <Route path="view-students" element={<ViewStudent />} />
              <Route path="manage-student" element={<ManageStudent />} />
              <Route path="delete-database" element={<DeleteDatabase />} />
              <Route path="house-allocations" element={<HouseAllocations />} />
              <Route path="*" element={<Error />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;

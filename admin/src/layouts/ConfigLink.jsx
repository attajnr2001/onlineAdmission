import "../styles/configLink.css";
import { NavLink } from "react-router-dom";
import { Settings, Person, Dashboard } from "@mui/icons-material";
import "../styles/configLink.css"

const ConfigLink = () => {
  return (
    <div className="container">
      <div className="links">
        <NavLink to="edit-sch-details" className="navLink">
          <Settings />
        </NavLink>

        <NavLink to="edit-admission-details" className="navLink">
          <Dashboard />
        </NavLink>

        <NavLink to="edit-student-dashboard" className="navLink">
          <Person />
        </NavLink>
      </div>
    </div>
  );
};

export default ConfigLink;

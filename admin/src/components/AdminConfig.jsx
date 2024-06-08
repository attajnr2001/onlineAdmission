import React from "react";
import { Outlet } from "react-router-dom";
import ConfigLink from "../layouts/ConfigLink";


const AdminConfig = () => {
  return (
    <div>
      <ConfigLink />
      <Outlet />
    </div>
  );
};

export default AdminConfig;

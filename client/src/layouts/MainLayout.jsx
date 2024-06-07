import React from "react";
import { Outlet } from "react-router-dom";

const MainLayout = () => {
  return (
    <>
      <div className="outlet">
        <Outlet />
      </div>
    </>
  );
};

export default MainLayout;

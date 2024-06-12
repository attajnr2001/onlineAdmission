import React, { lazy, Suspense, useState, useMemo } from "react";
import { Outlet } from "react-router-dom";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { motion, AnimatePresence } from "framer-motion";

const Widget = lazy(() => import("../components/Widget"));

const Dashboard = () => {
  const { schoolID } = useParams();
  const [showWidgets, setShowWidgets] = useState(true);

  const toggleWidgets = () => {
    setShowWidgets(!showWidgets);
  };

  const widgetTypes = useMemo(() => ["placed", "admitted", "regected"], []);

  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 2,
        }}
      >
        <IconButton onClick={toggleWidgets} sx={{ p: 0 }}>
          {showWidgets ? <VisibilityOffIcon /> : <VisibilityIcon />}
        </IconButton>
      </Box>
      <AnimatePresence>
        {showWidgets && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                display: { xs: "block", md: "flex" },
                flexDirection: { xs: "column", md: "row" },
                justifyContent: "space-between",
                gap: 2,
                padding: 2,
              }}
            >
              {widgetTypes.map((type) => (
                <Box key={type} sx={{ flex: 1, display: "flex" }}>
                  <Suspense fallback={<div>Loading...</div>}>
                    <Widget type={type} />
                  </Suspense>
                </Box>
              ))}
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
      <Outlet />
    </>
  );
};

export default React.memo(Dashboard);

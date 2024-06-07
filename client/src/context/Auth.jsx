import { useState, createContext } from "react";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [studentID, setStudentID] = useState(null);

  const login = (studentID) => {
    setIsAuthenticated(true);
    setStudentID(studentID);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setStudentID(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, studentID, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };

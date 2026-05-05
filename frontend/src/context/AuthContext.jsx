import { createContext, useState, useEffect, useContext } from "react";

import API from "../api/axios"; // Your axios instance

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const [token, setToken] = useState(localStorage.getItem("token") || null);

  const [loading, setLoading] = useState(true); // Prevents flickers on reload

  // Run this once when the app loads to check if they are already logged in

  // AuthContext.jsx
  useEffect(() => {
    const verifyLoggedInUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Hit the backend to get fresh data including roles
        const res = await API.get("/auth/me");

        // Update local state with the full user object (contains role)
        setUser(res.data);

        // Sync local storage just in case it was missing
        localStorage.setItem("user_role", res.data.role);
      } catch (error) {
        console.error("Token invalid or expired");
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyLoggedInUser();
  }, [token]);
  // The function to call when they Verify OTP or Login

  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);

    localStorage.setItem("user_role", userData.role);

    setToken(newToken);

    setUser(userData);
  };

  // The function to call when they click Logout

  const logout = () => {
    localStorage.removeItem("token");

    localStorage.removeItem("user_role");

    setToken(null);

    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to make it easy to use anywhere

export const useAuth = () => useContext(AuthContext);

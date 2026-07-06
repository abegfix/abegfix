import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import API from "../api/axios"; // Your axios instance

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true); // Prevents flickers on reload

  // Wrap logout in useCallback so it can safely be a dependency if needed
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    setToken(null);
    setUser(null);
  }, []);

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
        setUser(res.data);
        localStorage.setItem("user_role", res.data.role);
      } catch (error) {
        console.error("Token invalid or expired");
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyLoggedInUser();
  }, [token, logout]);
  // The function to call when they Verify OTP or Login

  const login = (newToken, userData) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user_role", userData.role);
    setToken(newToken);
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setUser,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

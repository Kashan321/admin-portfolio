import axios from "axios";
import { createContext, useState, useEffect } from "react";
import { API_BASE_URL } from "../utils/constants";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken"); // Use the correct key
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const auth_context = createContext();

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [token, setToken] = useState(null)

  useEffect(() => {
    checkAuth();
  }, []);

  // Login function
  const handleLogin = async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      const { accessToken } = response.data; // Use the correct key
      console.log(response.data);
      
      localStorage.setItem("accessToken", accessToken); // Use the correct key
      setAuthenticated(true);

      setToken(accessToken)
      return accessToken; 
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem("accessToken"); // Use the correct key
    setAuthenticated(false);
    window.location.href = "/login"; // Redirect to login page
  };

  // Check if the user is authenticated
  const checkAuth = () => {
    const token = localStorage.getItem("accessToken"); // Use the correct key
    if (token) {
      setAuthenticated(true);
    } else {
      setAuthenticated(false);
    }
  };

  // Value to be provided by the context
  const value = {
    authenticated,
    handleLogin,
    handleLogout,
    checkAuth,
    token
  };

  return (
    <auth_context.Provider value={value}>{children}</auth_context.Provider>
  );
};
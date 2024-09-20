import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:10000";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const checkUsernameUnique = async (username) => {
    try {
      console.log(`Checking uniqueness for username: ${username}`);
      const response = await fetch(`${API_URL}/users?username=${username}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const users = await response.json();
      console.log(`Users found with this username: ${users.length}`);
      return users.length === 0;
    } catch (error) {
      console.error("Error checking username uniqueness:", error);
      throw error;
    }
  };

  const checkPhoneUnique = async (phone) => {
    try {
      console.log(`Checking uniqueness for phone: ${phone}`);
      const response = await fetch(`${API_URL}/users?phoneNumber=${phone}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const users = await response.json();
      console.log(`Users found with this phone: ${users.length}`);
      return users.length === 0;
    } catch (error) {
      console.error("Error checking phone uniqueness:", error);
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const user = await response.json();
      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      console.log("Attempting to register user:", userData.username);

      // Check if username is unique
      const isUsernameUnique = await checkUsernameUnique(userData.username);
      if (!isUsernameUnique) {
        throw new Error("Username already exists");
      }

      // Check if phone number is unique
      const isPhoneUnique = await checkPhoneUnique(userData.phoneNumber);
      if (!isPhoneUnique) {
        throw new Error("Phone number already in use");
      }

      // If both checks pass, proceed with registration
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const newUser = await response.json();
      console.log("User registered successfully:", newUser.username);
      setUser(newUser);
      localStorage.setItem("user", JSON.stringify(newUser));
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        checkUsernameUnique,
        checkPhoneUnique,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

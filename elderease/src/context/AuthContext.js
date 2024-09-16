// Import necessary React hooks
import React, { createContext, useContext, useState, useEffect } from "react";

// Create a new context for authentication
const AuthContext = createContext();

// AuthProvider component: Manages authentication state and provides auth functions
export const AuthProvider = ({ children }) => {
  // State to store the current user and loading status
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Effect to check for a stored user on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Function to check if a username is unique
  // Input: username (string)
  // Output: boolean (true if unique, false otherwise)
  const checkUsernameUnique = async (username) => {
    try {
      const response = await fetch(
        `http://localhost:3005/users?username=${username}`
      );
      const users = await response.json();
      return users.length === 0;
    } catch (error) {
      console.error("Error checking username uniqueness:", error);
      return false;
    }
  };

  // Function to check if a phone number is unique
  // Input: phone (string)
  // Output: boolean (true if unique, false otherwise)
  const checkPhoneUnique = async (phone) => {
    try {
      const response = await fetch(
        `http://localhost:3005/users?phoneNumber=${phone}`
      );
      const users = await response.json();
      return users.length === 0;
    } catch (error) {
      console.error("Error checking phone uniqueness:", error);
      return false;
    }
  };

  // Function to handle user login
  // Input: credentials (object with username and password)
  // Output: boolean (true if login successful, false otherwise)
  const login = async (credentials) => {
    try {
      const response = await fetch("http://localhost:3005/users");
      const users = await response.json();
      const user = users.find(
        (u) =>
          u.username === credentials.username &&
          u.password === credentials.password
      );

      if (user) {
        const { password, ...userWithoutPassword } = user;
        setUser(userWithoutPassword);
        localStorage.setItem("user", JSON.stringify(userWithoutPassword));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  // Function to handle user registration
  // Input: userData (object with user details)
  // Output: boolean (true if registration successful, false otherwise)
  const register = async (userData) => {
    try {
      const isUsernameUnique = await checkUsernameUnique(userData.username);
      const isPhoneUnique = await checkPhoneUnique(userData.phoneNumber);

      if (!isUsernameUnique) {
        throw new Error("Username already exists");
      }

      if (!isPhoneUnique) {
        throw new Error("Phone number already in use");
      }

      const response = await fetch("http://localhost:3005/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...userData, id: Date.now() }),
      });

      if (response.ok) {
        const newUser = await response.json();
        const { password, ...userWithoutPassword } = newUser;
        setUser(userWithoutPassword);
        localStorage.setItem("user", JSON.stringify(userWithoutPassword));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // Function to handle user logout
  // Input: None
  // Output: None (clears user state and local storage)
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  // Provide the authentication context to child components
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

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

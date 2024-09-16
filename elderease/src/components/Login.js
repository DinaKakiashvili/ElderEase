import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Alert from "./Alert";

function Login() {
  // State variables
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Effect for handling redirect countdown
  useEffect(() => {
    console.log("useEffect running, redirectCountdown:", redirectCountdown);
    let timer;
    if (redirectCountdown !== null && redirectCountdown > 0) {
      timer = setTimeout(() => {
        console.log("Countdown tick, new value:", redirectCountdown - 1);
        setRedirectCountdown(redirectCountdown - 1);
        setAlert({
          type: "success",
          message: `Login successful. Redirecting in ${
            redirectCountdown - 1
          } seconds...`,
        });
      }, 1000);
    } else if (redirectCountdown === 0) {
      console.log("Countdown finished, navigating to dashboard");
      navigate("/dashboard");
    }
    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted");
    setIsLoading(true);
    setAlert(null);

    try {
      console.log("Attempting login");
      const success = await login({ username, password });
      console.log("Login result:", success);
      if (success) {
        console.log("Login successful, setting alert");
        setAlert({
          type: "success",
          message: "Login successful. Redirecting in 5 seconds...",
        });
        setTimeout(() => {
          console.log("Setting redirect countdown");
          setRedirectCountdown(5);
        }, 0);
      } else {
        console.log("Login failed, setting error alert");
        setAlert({
          type: "error",
          message: "Invalid username or password",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      setAlert({
        type: "error",
        message: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Render login form
  return (
    <div className="max-w-md p-8 mx-auto bg-white rounded-lg shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-center text-gray-800">
        Login
      </h2>
      {alert && (
        <div className="mb-4">
          <Alert type={alert.type} message={alert.message} />
          {/* Fallback inline alert */}
          <div
            className={`p-4 rounded-md ${
              alert.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {alert.message}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username input */}
        <input
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        {/* Password input */}
        <input
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {/* Submit button */}
        <button
          className={`w-full bg-green-500 text-white p-3 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
      {/* Link to registration page */}
      <Link
        to="/register"
        className="block mt-4 text-center text-blue-500 hover:underline"
      >
        Register
      </Link>
    </div>
  );
}

export default Login;

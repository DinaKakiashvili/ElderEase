import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Alert from "./Alert";

function Register() {
  // State variables for form fields and component state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("elderly");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [languages, setLanguages] = useState([]);
  const [birthDate, setBirthDate] = useState("");
  const [transportation, setTransportation] = useState([]);
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(null);

  const navigate = useNavigate();
  const { register, checkUsernameUnique, checkPhoneUnique } = useAuth();

  // Effect for handling redirect countdown
  useEffect(() => {
    let timer;
    if (redirectCountdown !== null && redirectCountdown > 0) {
      timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
    } else if (redirectCountdown === 0) {
      navigate("/dashboard");
    }
    return () => clearTimeout(timer);
  }, [redirectCountdown, navigate]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setAlert(null);
    // Check if passwords match
    if (password !== confirmPassword) {
      setAlert({ type: "error", message: "Passwords don't match" });
      setIsLoading(false);
      return;
    }
    try {
      // Check if username is unique
      const isUsernameUnique = await checkUsernameUnique(username);
      if (!isUsernameUnique) {
        setAlert({ type: "error", message: "Username already exists" });
        setIsLoading(false);
        return;
      }
      // Check if phone number is unique
      const isPhoneUnique = await checkPhoneUnique(phoneNumber);
      if (!isPhoneUnique) {
        setAlert({ type: "error", message: "Phone number already in use" });
        setIsLoading(false);
        return;
      }
      // Register user
      const userData = {
        username,
        password,
        userType,
        firstName,
        lastName,
        phoneNumber,
        address,
        languages,
        ...(userType === "volunteer" && { birthDate, transportation }),
      };

      const success = await register(userData);
      if (success) {
        setAlert({
          type: "success",
          message:
            "Registration successful. Redirecting to dashboard in 5 seconds...",
        });
        setRedirectCountdown(5);
      } else {
        setAlert({
          type: "error",
          message: "Registration failed. Please try again.",
        });
        setIsLoading(false);
      }
    } catch (error) {
      setAlert({ type: "error", message: error.message });
      setIsLoading(false);
    }
  };
  // Toggle language selection
  const toggleLanguage = (lang) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };
  // Toggle transportation selection
  const toggleTransportation = (transport) => {
    setTransportation((prev) =>
      prev.includes(transport)
        ? prev.filter((t) => t !== transport)
        : [...prev, transport]
    );
  };
  // Render the component
  return (
    <div className="max-w-md px-8 pt-6 pb-8 mx-auto mb-4 bg-white rounded shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-center">Register</h2>
      {alert && <Alert type={alert.type} message={alert.message} />}
      {/* Form fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-3 border border-gray-300 rounded"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          className="w-full p-3 border border-gray-300 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <input
          className="w-full p-3 border border-gray-300 rounded"
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <div className="flex space-x-4">
          <button
            type="button"
            className={`flex-1 py-2 rounded ${
              userType === "elderly" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
            onClick={() => setUserType("elderly")}
          >
            Elderly
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded ${
              userType === "volunteer"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
            onClick={() => setUserType("volunteer")}
          >
            Volunteer
          </button>
        </div>
        <input
          className="w-full p-3 border border-gray-300 rounded"
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <input
          className="w-full p-3 border border-gray-300 rounded"
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <input
          className="w-full p-3 border border-gray-300 rounded"
          type="tel"
          placeholder="Phone Number"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
        />
        <input
          className="w-full p-3 border border-gray-300 rounded"
          type="text"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
        <div>
          <p className="mb-2 font-bold">Additional Languages:</p>
          <div className="flex flex-wrap justify-between gap-2">
            {["English", "Arabic", "French", "Russian"].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-3 py-3 rounded ${
                  languages.includes(lang)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>
        {userType === "volunteer" && (
          <>
            <p className="mb-2 font-bold">Date of Birth:</p>
            <input
              className="w-full p-3 border border-gray-300 rounded"
              type="date"
              placeholder="Birth Date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
            <div>
              <p className="mb-2 font-bold">Transportation:</p>
              <div className="flex flex-wrap gap-2">
                {["Car", "Bike", "Scooter", "Public Transportation"].map(
                  (transport) => (
                    <button
                      key={transport}
                      type="button"
                      onClick={() => toggleTransportation(transport)}
                      className={`px-3 py-1 rounded ${
                        transportation.includes(transport)
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {transport}
                    </button>
                  )
                )}
              </div>
            </div>
          </>
        )}
        <button
          className={`w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 ${
            isLoading ? "opacity-50 cursor-not-allowed" : ""
          }`}
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Registering..." : "Register"}
        </button>
      </form>
      <p className="mt-4 text-center">
        <Link to="/" className="text-blue-500 hover:underline">
          Already have an account? Login
        </Link>
      </p>
    </div>
  );
}
export default Register;

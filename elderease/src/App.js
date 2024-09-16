// Import necessary dependencies and components
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";
import ElderlyDashboard from "./components/ElderlyDashboard";
import VolunteerDashboard from "./components/VolunteerDashboard";
import Alert from "./components/Alert";
import Notifications from "./components/Notifications";

// PrivateRoute component: Renders children if user is authenticated, otherwise redirects to home
// Input: children components
// Output: Rendered children or redirect
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>;
  }
  return user ? children : <Navigate to="/" replace />;
};

// PublicRoute component: Renders children if user is not authenticated, otherwise redirects to dashboard
// Input: children components
// Output: Rendered children or redirect
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div>Loading...</div>;
  }
  return user ? <Navigate to="/dashboard" replace /> : children;
};

// Main application content component
function AppContent() {
  const { user, logout, loading } = useAuth();
  const [alert, setAlert] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  const API_BASE_URL = "http://localhost:3005";

  // Function to fetch notifications from the server
  // Input: None
  // Output: None, but updates notifications state
  const fetchNotifications = useCallback(async () => {
    if (!user) return; // Add this check to prevent accessing user.id when user is null
    try {
      const response = await fetch(
        `${API_BASE_URL}/notifications?userId=${user.id}&_sort=createdAt&_order=desc`
      );
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched notifications:", data);
        setNotifications(data);
        setUnreadCount(
          data.filter((notification) => !notification.read).length
        );
      } else {
        console.error("Failed to fetch notifications");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [user, API_BASE_URL]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  // Function to open a specific task
  // Input: taskId
  // Output: None, but navigates to the task page
  const openTask = (taskId) => {
    setShowNotifications(false);
    navigate(`/dashboard?taskId=${taskId}`);
  };

  // Effect to fetch notifications periodically when user is logged in
  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  // Effect to handle clicks outside the notification panel
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

  // Function to handle user logout
  // Input: None
  // Output: None, but logs out user and navigates to home
  const handleLogout = () => {
    setAlert({
      type: "success",
      message: "Logged out successfully. Redirecting to login...",
    });
    setTimeout(() => {
      logout();
      setAlert(null);
      navigate("/");
    }, 2000);
  };

  // Function to toggle notifications panel
  // Input: None
  // Output: None, but toggles showNotifications state
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  // Function to mark all notifications as read
  // Input: None
  // Output: None, but updates notifications on server and client
  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter((notification) => !notification.read)
          .map((notification) =>
            fetch(`${API_BASE_URL}/notifications/${notification.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ read: true }),
            })
          )
      );
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Function to clear all notifications
  // Input: None
  // Output: None, but deletes all notifications on server and updates client state
  const handleClearAllNotifications = async () => {
    try {
      await Promise.all(
        notifications.map((notification) =>
          fetch(`${API_BASE_URL}/notifications/${notification.id}`, {
            method: "DELETE",
          })
        )
      );
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error clearing all notifications:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Render the main application layout and routes
  return (
    <div className="min-h-screen bg-background text-text">
      <header className="p-4 text-white bg-primary">
        <div className="container flex items-center justify-between mx-auto">
          <h1 className="text-2xl font-bold">ElderEase</h1>
          <nav className="flex items-center">
            {user && (
              <div className="relative" ref={notificationRef}>
                <button onClick={toggleNotifications} className="relative mr-4">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 z-20 mt-2 overflow-hidden bg-white rounded-md shadow-lg w-85">
                    <div className="py-2">
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-100">
                        <h3 className="text-lg font-semibold text-black">
                          Notifications
                        </h3>
                        <div>
                          <button
                            onClick={handleMarkAllAsRead}
                            className="mr-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            Mark all as read
                          </button>
                          <button
                            onClick={handleClearAllNotifications}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Clear all
                          </button>
                        </div>
                      </div>
                      <Notifications
                        notifications={notifications}
                        onClose={() => setShowNotifications(false)}
                        onNotificationClick={fetchNotifications}
                        openTask={openTask}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="mr-4 text-white hover:underline"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white hover:underline"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/" className="mr-4 text-white hover:underline">
                  Login
                </Link>
                <Link to="/register" className="text-white hover:underline">
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container p-4 mx-auto mt-8">
        {alert && <Alert type={alert.type} message={alert.message} />}
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                {user?.userType === "elderly" ? (
                  <ElderlyDashboard />
                ) : (
                  <VolunteerDashboard />
                )}
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
// Main App component wrapping AppContent with Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

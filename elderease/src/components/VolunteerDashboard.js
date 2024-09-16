import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import TaskList from "./TaskList";
import TaskModal from "./TaskModal";

const VolunteerDashboard = () => {
  // Get user information from AuthContext
  const { user } = useAuth();

  // State for tasks and selected task
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  // Get current location (for URL params)
  const location = useLocation();

  // API base URL
  const API_BASE_URL = "http://localhost:3005";

  // Effect to fetch tasks and handle URL params
  useEffect(() => {
    fetchTasks();
    const searchParams = new URLSearchParams(location.search);
    const taskId = searchParams.get("taskId");
    if (taskId) {
      fetchTask(taskId);
    }
  }, [user.id, location]);

  // Function to fetch all tasks
  const fetchTasks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        console.error("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Function to fetch a specific task
  const fetchTask = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
      if (response.ok) {
        const task = await response.json();
        setSelectedTask(task);
      } else {
        console.error("Failed to fetch task");
      }
    } catch (error) {
      console.error("Error fetching task:", error);
    }
  };

  // Handler for task click
  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  // Handler for closing task modal
  const handleCloseModal = () => {
    setSelectedTask(null);
    fetchTasks(); // Refresh tasks after closing modal
  };

  // Render the dashboard
  return (
    <div className="container p-4 mx-auto">
      <h1 className="mb-4 text-2xl font-bold">Volunteer Dashboard</h1>

      {/* User Information Section */}
      <div className="px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md">
        <h2 className="mb-2 text-xl font-semibold">User Information</h2>
        <p>
          <strong>Name:</strong> {user.firstName} {user.lastName}
        </p>
        <p>
          <strong>Phone:</strong> {user.phoneNumber}
        </p>
        <p>
          <strong>Address:</strong> {user.address}
        </p>
        <p>
          <strong>Languages:</strong> {user.languages.join(", ")}
        </p>
        <p>
          <strong>Transportation:</strong> {user.transportation.join(", ")}
        </p>
        <p>
          <strong>Average Rating:</strong>{" "}
          {user.averageRating ? user.averageRating.toFixed(1) : "N/A"}
        </p>
      </div>

      {/* Task List Component */}
      <TaskList
        userType="volunteer"
        tasks={tasks}
        onTaskClick={handleTaskClick}
        userId={user.id}
      />

      {/* Task Modal (shown when a task is selected) */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={handleCloseModal}
          onTaskUpdate={fetchTasks}
          isVolunteer={true}
        />
      )}
    </div>
  );
};

export default VolunteerDashboard;

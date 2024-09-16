import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import TaskList from "./TaskList";
import TaskForm from "./TaskForm";
import TaskModal from "./TaskModal";

const ElderlyDashboard = () => {
  const { user } = useAuth();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [tasksKey, setTasksKey] = useState(0);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const location = useLocation();

  const API_BASE_URL = "http://localhost:3005";

  // Memoize fetchTasks to avoid recreating it on every render
  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/tasks?elderlyId=${user.id}`
      );
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        console.error("Failed to fetch tasks");
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  }, [API_BASE_URL, user.id]);

  useEffect(() => {
    fetchTasks();
    const searchParams = new URLSearchParams(location.search);
    const taskId = searchParams.get("taskId");
    if (taskId) {
      fetchTask(taskId);
    }
  }, [location, fetchTasks]); // Add fetchTasks to the dependency array

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

  const handleTasksUpdated = () => {
    setTasksKey((prevKey) => prevKey + 1);
    fetchTasks();
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
    handleTasksUpdated();
  };

  return (
    <div className="container p-4 mx-auto">
      <h1 className="mb-4 text-2xl font-bold">Elderly Dashboard</h1>
      {/* User Information Section */}
      <div className="px-8 pt-6 pb-8 mb-4 bg-white rounded shadow-md">
        {/* ... user information ... */}
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
      </div>

      {/* Create New Request Button */}
      <div className="mb-4">
        <button
          onClick={() => setShowTaskForm(true)}
          className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
        >
          Create New Request
        </button>
      </div>
      <div>
        {/* Task Form */}
        {showTaskForm && (
          <TaskForm
            onClose={() => setShowTaskForm(false)}
            onTasksUpdated={handleTasksUpdated}
          />
        )}

        {/* Task List */}
        <TaskList
          key={tasksKey}
          userType="elderly"
          tasks={tasks}
          onTaskClick={setSelectedTask}
        />
      </div>
      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={handleCloseModal}
          isVolunteer={false}
        />
      )}
    </div>
  );
};

export default ElderlyDashboard;

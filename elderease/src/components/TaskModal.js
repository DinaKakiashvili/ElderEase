import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import ChatComponent from "./ChatComponent";

const TaskModal = ({ task, onClose, onCancel, isVolunteer }) => {
  const { user } = useAuth();
  const API_BASE_URL = "http://localhost:3005";

  // State for user details and rating
  const [elderlyDetails, setElderlyDetails] = useState(null);
  const [volunteerDetails, setVolunteerDetails] = useState(null);
  const [rating, setRating] = useState(0);
  const [showRating, setShowRating] = useState(false);

  // Effect to fetch user details based on task and user type
  useEffect(() => {
    if (isVolunteer && task.elderlyId) {
      fetchElderlyDetails(task.elderlyId);
    } else if (!isVolunteer && task.volunteerId) {
      fetchVolunteerDetails(task.volunteerId);
    }
  }, [isVolunteer, task.elderlyId, task.volunteerId]);

  // Function to fetch elderly user details
  const fetchElderlyDetails = async (elderlyId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${elderlyId}`);
      if (response.ok) {
        const data = await response.json();
        setElderlyDetails(data);
      } else {
        console.error("Failed to fetch elderly details");
      }
    } catch (error) {
      console.error("Error fetching elderly details:", error);
    }
  };

  // Function to fetch volunteer user details
  const fetchVolunteerDetails = async (volunteerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${volunteerId}`);
      if (response.ok) {
        const data = await response.json();
        setVolunteerDetails(data);
      } else {
        console.error("Failed to fetch volunteer details");
      }
    } catch (error) {
      console.error("Error fetching volunteer details:", error);
    }
  };

  // Function to handle task acceptance by volunteer
  const handleAcceptTask = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Accepted", volunteerId: user.id }),
      });
      if (response.ok) {
        onClose();
      } else {
        console.error("Failed to accept task");
      }
    } catch (error) {
      console.error("Error accepting task:", error);
    }
  };

  // Function to handle task completion by volunteer
  const handleCompleteTask = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Completed",
          completedAt: new Date().toISOString(),
        }),
      });
      if (response.ok) {
        onClose();
      } else {
        console.error("Failed to complete task");
      }
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  // Function to show rating UI when elderly confirms task completion
  const handleConfirmCompletion = () => {
    setShowRating(true);
  };

  // Function to submit rating and update task status
  const handleSubmitRating = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Archived",
          elderlyConfirmed: true,
          rating: rating,
        }),
      });
      if (response.ok) {
        // Update volunteer's rating
        if (volunteerDetails) {
          const newRating =
            (volunteerDetails.rating * volunteerDetails.ratingCount + rating) /
            (volunteerDetails.ratingCount + 1);
          const newRatingCount = volunteerDetails.ratingCount + 1;
          await fetch(`${API_BASE_URL}/users/${volunteerDetails.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              rating: newRating,
              ratingCount: newRatingCount,
            }),
          });
        }
        onClose();
      } else {
        console.error("Failed to confirm task completion and submit rating");
      }
    } catch (error) {
      console.error(
        "Error confirming task completion and submitting rating:",
        error
      );
    }
  };
  // Function to handle task cancellation by volunteer or elderly
  const handleBackdropClick = (e) => {
    // Only close if the backdrop itself is clicked, not its children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={handleBackdropClick}
      ></div>
      {/* Modal content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none">
        <div className="relative w-auto max-w-4xl mx-auto my-6">
          <div className="relative flex flex-col bg-white border-0 rounded-lg shadow-lg outline-none w-4xl focus:outline-none">
            {/* Modal header */}
            <div className="flex items-start justify-between p-5 border-b border-solid rounded-t border-blueGray-200">
              <h3 className="text-2xl font-semibold">{task.title}</h3>
              <button
                className="float-right p-1 ml-auto text-3xl font-semibold leading-none text-black bg-transparent border-0 outline-none opacity-5 focus:outline-none"
                onClick={onClose}
              >
                <span className="block w-6 h-6 text-2xl text-black bg-transparent outline-none opacity-5 focus:outline-none">
                  ×
                </span>
              </button>
            </div>
            {/* Modal body */}
            <div className="relative flex-auto p-6">
              {/* Task details */}
              <p className="my-4 text-lg leading-relaxed text-blueGray-500">
                {task.description}
              </p>
              <p className="text-sm text-gray-600">
                Created: {new Date(task.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Status: {task.status}</p>
              {/* Task image */}
              {task.image && (
                <img
                  src={`${API_BASE_URL}${task.image}`}
                  alt="Task"
                  className="w-1/2 mt-4 rounded"
                />
              )}
              {/* User details section */}
              {isVolunteer && elderlyDetails && (
                <div className="mt-4">
                  <h4 className="font-semibold">Elderly Details:</h4>
                  <p>
                    Name: {elderlyDetails.firstName} {elderlyDetails.lastName}
                  </p>
                  <p>Phone: {elderlyDetails.phoneNumber}</p>
                  <p>Address: {elderlyDetails.address}</p>
                </div>
              )}
              {!isVolunteer && volunteerDetails && (
                <div className="mt-4">
                  <h4 className="font-semibold">Volunteer Details:</h4>
                  <p>
                    Name: {volunteerDetails.firstName}{" "}
                    {volunteerDetails.lastName}
                  </p>
                  <p>Phone: {volunteerDetails.phoneNumber}</p>
                  <p>
                    Rating:{" "}
                    {volunteerDetails.rating
                      ? volunteerDetails.rating.toFixed(1)
                      : "N/A"}
                  </p>
                </div>
              )}
            </div>
            {/* Chat section */}
            {(task.status === "Accepted" || task.status === "Completed") && (
              <div className="p-6 border-t border-solid border-blueGray-200">
                <h4 className="mb-2 font-semibold">Chat</h4>
                <ChatComponent taskId={task.id} />
              </div>
            )}
            {/* Action buttons */}
            <div className="flex flex-row items-center justify-end p-6 border-t border-solid rounded-b border-blueGray-200">
              {/* Conditional rendering of action buttons based on user type and task status */}
              {isVolunteer && task.status === "Open" && (
                <button
                  className="px-6 py-3 mb-1 mr-1 text-sm font-bold text-white uppercase transition-all duration-150 ease-linear bg-green-500 rounded shadow outline-none active:bg-emerald-600 hover:shadow-lg focus:outline-none"
                  type="button"
                  onClick={handleAcceptTask}
                >
                  Accept Task
                </button>
              )}
              {isVolunteer && task.status === "Accepted" && (
                <button
                  className="px-6 py-3 mb-1 mr-1 text-sm font-bold text-white uppercase transition-all duration-150 ease-linear bg-green-500 rounded shadow outline-none active:bg-emerald-600 hover:shadow-lg focus:outline-none"
                  type="button"
                  onClick={handleCompleteTask}
                >
                  Complete Task
                </button>
              )}
              {!isVolunteer &&
                task.status === "Completed" &&
                !task.elderlyConfirmed && (
                  <button
                    className="px-6 py-3 mb-1 mr-1 text-sm font-bold text-white uppercase transition-all duration-150 ease-linear rounded shadow outline-none bg-emerald-500 active:bg-emerald-600 hover:shadow-lg focus:outline-none"
                    type="button"
                    onClick={handleConfirmCompletion}
                  >
                    Confirm Completion
                  </button>
                )}

              {task.status !== "Completed" && task.status !== "Archived" && (
                <button
                  className="px-6 py-3 mb-1 mr-1 text-sm font-bold text-white uppercase transition-all duration-150 ease-linear bg-red-600 rounded shadow outline-none active:bg-red-100 hover:shadow-lg focus:outline-none"
                  type="button"
                  onClick={() => onCancel(task.id)}
                >
                  Cancel Task
                </button>
              )}
              <button
                className="px-6 py-3 mb-1 mr-1 text-sm font-bold text-white uppercase transition-all duration-150 ease-linear bg-gray-500 rounded shadow outline-none active:bg-gray-600 hover:shadow-lg focus:outline-none"
                type="button"
                onClick={onClose}
              >
                Close
              </button>
            </div>
            {/* Rating UI */}
            {showRating && (
              <div className="flex flex-col items-center mb-2">
                <p className="mb-2">Rate Volunteer:</p>
                <div className="flex mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`text-2xl ${
                        star <= rating ? "text-yellow-500" : "text-gray-300"
                      }`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
                <button
                  className="px-4 py-2 text-sm font-bold text-white uppercase transition-all duration-150 ease-linear bg-blue-500 rounded shadow outline-none active:bg-blue-600 hover:shadow-lg focus:outline-none"
                  onClick={handleSubmitRating}
                >
                  Submit Rating
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskModal;

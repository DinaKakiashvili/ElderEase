import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Notifications = ({
  notifications,
  onClose,
  onNotificationClick,
  openTask,
}) => {
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();

  // Log notifications when they change (for debugging)
  useEffect(() => {
    console.log("Received notifications:", notifications);
  }, [notifications]);

  // Handle click on a notification
  const handleNotificationClick = async (notification) => {
    try {
      // Mark the notification as read
      await fetch(`http://localhost:3005/notifications/${notification.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ read: true }),
      });
      onNotificationClick();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }

    // If the notification is related to a task, open that task
    if (notification.taskId) {
      openTask(notification.taskId);
    }
    onClose();
  };

  // Render the notifications list
  return (
    <div className="overflow-y-auto max-h-96">
      {notifications.length > 0 ? (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 border-b cursor-pointer hover:bg-gray-100 ${
              notification.read ? "bg-white" : "bg-blue-50"
            }`}
            onClick={() => handleNotificationClick(notification)}
          >
            <h4 className="font-semibold text-black">{notification.title}</h4>
            <p className="text-sm text-gray-600">{notification.message}</p>
            <p className="mt-1 text-xs text-gray-400">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
          </div>
        ))
      ) : (
        <div className="p-4 text-center text-gray-500">
          <p>No notifications</p>
          <p className="mt-2 text-sm">You're all caught up!</p>
        </div>
      )}
    </div>
  );
};

export default Notifications;

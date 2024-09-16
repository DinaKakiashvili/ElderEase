// Import required modules
const jsonServer = require("json-server");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const express = require("express");

// Create JSON server instance
const server = jsonServer.create();
const middlewares = jsonServer.defaults();
const router = jsonServer.router(path.join(__dirname, "db.json"));

// Apply middlewares
server.use(cors());
server.use(middlewares);
server.use(express.json({ limit: "10mb" }));

// POST endpoint for creating new tasks
// Input: Task details in request body
// Output: New task object
server.post("/tasks", (req, res) => {
  const db = router.db;
  const newTask = { ...req.body, id: Date.now().toString() };
  db.get("tasks").push(newTask).write();

  console.log("New task created:", newTask);

  // Notify all volunteers about the new task
  const volunteers = db.get("users").filter({ userType: "volunteer" }).value();
  console.log(`Found ${volunteers.length} volunteers to notify`);

  if (volunteers.length === 0) {
    console.log("No volunteers found in the database");
  }

  volunteers.forEach((volunteer) => {
    console.log(`Creating notification for volunteer ${volunteer.id}`);
    try {
      const notification = createNotification(
        volunteer.id,
        "New Task Available",
        `A new task "${newTask.title}" is available.`,
        newTask.id
      );
      console.log(`Successfully created notification:`, notification);
    } catch (error) {
      console.error(
        `Error creating notification for volunteer ${volunteer.id}:`,
        error
      );
    }
  });

  // Log all notifications after creating new ones
  const allNotifications = db.get("notifications").value();
  console.log(`Total notifications in database: ${allNotifications.length}`);
  console.log("All notifications:", allNotifications);

  res.status(201).json(newTask);
});

// PATCH endpoint for updating tasks
// Input: Task ID in URL params, updated task details in request body
// Output: Success message or error
server.patch("/tasks/:id", (req, res) => {
  const taskId = req.params.id;
  const { status, volunteerId, elderlyConfirmed, rating } = req.body;
  const db = router.db;
  const task = db.get("tasks").find({ id: taskId }).value();

  console.log(`Updating task ${taskId}:`, req.body);

  if (task) {
    db.get("tasks")
      .find({ id: taskId })
      .assign({ ...req.body })
      .write();

    // Create notifications based on task status changes
    if (status === "Accepted") {
      const volunteer = db.get("users").find({ id: volunteerId }).value();
      createNotification(
        task.elderlyId,
        "Task Accepted",
        `Your task "${task.title}" has been accepted by ${volunteer.firstName} ${volunteer.lastName}.`,
        taskId
      );
    } else if (status === "Completed") {
      createNotification(
        task.elderlyId,
        "Task Completed",
        `Your task "${task.title}" has been marked as completed. Please confirm and rate the volunteer.`,
        taskId
      );
      createNotification(
        task.volunteerId,
        "Task Completed",
        `You have marked the task "${task.title}" as completed. Waiting for elderly confirmation.`,
        taskId
      );
    } else if (elderlyConfirmed && rating) {
      createNotification(
        task.volunteerId,
        "Task Rated",
        `The task "${task.title}" has been confirmed completed and you've received a rating of ${rating}.`,
        taskId
      );
    }

    res.json({ success: true, message: "Task updated successfully" });
  } else {
    console.log(`Task ${taskId} not found`);
    res.status(404).json({ success: false, message: "Task not found" });
  }
});

// PATCH endpoint for archiving completed tasks
// Input: Task ID in URL params
// Output: Success message or error
server.patch("/tasks/:id/archive", (req, res) => {
  const taskId = req.params.id;
  const db = router.db;
  const task = db.get("tasks").find({ id: taskId }).value();

  if (task && task.status === "Completed" && task.elderlyConfirmed) {
    db.get("tasks").find({ id: taskId }).assign({ archived: true }).write();
    res.json({ success: true, message: "Task archived successfully" });
  } else {
    res
      .status(400)
      .json({ success: false, message: "Task cannot be archived" });
  }
});

// POST endpoint for handling file uploads
// Input: Base64 encoded image data in request body
// Output: Uploaded file ID
server.post("/uploads", (req, res) => {
  const uploadsDir = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
  }

  const id = Date.now().toString();
  const base64Data = req.body.base64.replace(/^data:image\/\w+;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");
  const filePath = path.join(uploadsDir, `${id}.png`);

  fs.writeFile(filePath, buffer, (err) => {
    if (err) {
      console.error("Error writing upload file:", err);
      return res.status(500).json({ error: "Error saving upload" });
    }
    res.status(201).json({ id: `${id}.png` });
  });
});

// GET endpoint for fetching chat messages
// Input: Task ID in URL params
// Output: Array of messages for the specified task
server.get("/tasks/:id/messages", (req, res) => {
  const taskId = req.params.id;
  const db = router.db;
  const messages = db.get("messages").filter({ taskId: taskId }).value();
  res.json(messages);
});

// POST endpoint for adding chat messages
// Input: Task ID in URL params, message details in request body
// Output: New message object
server.post("/tasks/:id/messages", (req, res) => {
  const taskId = req.params.id;
  const db = router.db;
  const newMessage = { ...req.body, taskId: taskId, id: Date.now().toString() };
  db.get("messages").push(newMessage).write();

  const task = db.get("tasks").find({ id: taskId }).value();
  const recipientId =
    newMessage.senderId === task.elderlyId ? task.volunteerId : task.elderlyId;

  createNotification(
    recipientId,
    "New Message",
    `You have a new message in task "${task.title}".`,
    taskId
  );

  res.status(201).json(newMessage);
});

// PATCH endpoint for rating a user
// Input: User ID in URL params, rating and task ID in request body
// Output: Updated user object
server.patch("/users/:id/rate", (req, res) => {
  const { id } = req.params;
  const { rating, taskId } = req.body;

  const user = router.db.get("users").find({ id }).value();
  const task = router.db.get("tasks").find({ id: taskId }).value();

  if (!user || !task) {
    return res.status(404).json({ error: "User or task not found" });
  }

  user.ratings.push(rating);
  user.averageRating =
    user.ratings.reduce((a, b) => a + b) / user.ratings.length;
  task.rating = rating;

  router.db.get("users").find({ id }).assign(user).write();
  router.db.get("tasks").find({ id: taskId }).assign(task).write();

  createNotification(
    user.id,
    "New Rating Received",
    `You received a new rating of ${rating} for the task "${task.title}".`,
    taskId
  );

  res.json(user);
});

// PATCH endpoint to mark a notification as read
// Input: Notification ID in URL params
// Output: Success message or error
server.patch("/notifications/:id", (req, res) => {
  const notificationId = req.params.id;
  const db = router.db;
  const notification = db
    .get("notifications")
    .find({ id: notificationId })
    .value();

  if (notification) {
    db.get("notifications")
      .find({ id: notificationId })
      .assign({ read: true })
      .write();
    res.json({ success: true, message: "Notification marked as read" });
  } else {
    res.status(404).json({ success: false, message: "Notification not found" });
  }
});

// Serve uploaded files
server.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Helper function to create notifications
// Input: User ID, notification title, message, and related task ID
// Output: New notification object
const createNotification = (userId, title, message, taskId) => {
  console.log(`Creating notification for user ${userId}`);
  const db = router.db;
  const newNotification = {
    id: Date.now().toString(),
    userId,
    title,
    message,
    taskId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  console.log("New notification object:", newNotification);
  db.get("notifications").push(newNotification).write();
  console.log(`Notification added to database for user ${userId}`);
  return newNotification;
};

// Use the standard db.json routes
server.use(router);

// Start the server
const PORT = 3005;
server.listen(PORT, () => {
  console.log(`JSON Server is running on http://localhost:${PORT}`);
});

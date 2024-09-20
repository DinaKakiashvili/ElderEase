const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

// CORS configuration
const corsOptions = {
  origin: [
    "https://incomparable-taiyaki-956d9f.netlify.app",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());

// Database connection
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  protocol: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

sequelize
  .authenticate()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error("Unable to connect to the database:", err));

// Define models
const User = sequelize.define("User", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false,
  },
  username: DataTypes.STRING,
  password: DataTypes.STRING,
  userType: DataTypes.STRING,
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  phoneNumber: DataTypes.STRING,
  address: DataTypes.STRING,
  languages: DataTypes.ARRAY(DataTypes.STRING),
  birthDate: DataTypes.DATE,
  transportation: DataTypes.ARRAY(DataTypes.STRING),
  ratings: DataTypes.ARRAY(DataTypes.INTEGER),
  averageRating: DataTypes.FLOAT,
});

const Task = sequelize.define("Task", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false,
  },
  title: DataTypes.STRING,
  description: DataTypes.TEXT,
  elderlyId: DataTypes.BIGINT,
  volunteerId: DataTypes.BIGINT,
  status: DataTypes.STRING,
  image: DataTypes.STRING,
  createdAt: DataTypes.DATE,
  completedAt: DataTypes.DATE,
  elderlyConfirmed: DataTypes.BOOLEAN,
  rating: DataTypes.INTEGER,
  archived: DataTypes.BOOLEAN,
});

const Message = sequelize.define("Message", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false,
  },
  senderId: DataTypes.BIGINT,
  senderName: DataTypes.STRING,
  content: DataTypes.TEXT,
  timestamp: DataTypes.DATE,
  taskId: DataTypes.BIGINT,
});

const Notification = sequelize.define("Notification", {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false,
  },
  userId: DataTypes.BIGINT,
  title: DataTypes.STRING,
  message: DataTypes.TEXT,
  taskId: DataTypes.BIGINT,
  read: DataTypes.BOOLEAN,
  createdAt: DataTypes.DATE,
});

// Sync models with database
sequelize.sync({ force: false }).then(() => {
  console.log("Database synchronized");
});

// Helper Functions
const createNotification = async (userId, title, message, taskId) => {
  try {
    const newId =
      BigInt(Date.now()) * BigInt(1000) +
      BigInt(Math.floor(Math.random() * 1000));
    const newNotification = await Notification.create({
      id: newId.toString(),
      userId,
      title,
      message,
      taskId,
      read: false,
      createdAt: new Date(),
    });
    console.log(`Notification added for user ${userId}`);
    return newNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// User Routes
app.get("/users", async (req, res) => {
  try {
    const { username, phoneNumber } = req.query;
    let whereClause = {};

    if (username) {
      whereClause.username = username;
    }

    if (phoneNumber) {
      whereClause.phoneNumber = phoneNumber;
    }

    const users = await User.findAll({
      where: whereClause,
      attributes: ["id", "username", "phoneNumber"],
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/users", async (req, res) => {
  try {
    const userData = req.body;
    console.log("Received user data:", JSON.stringify(userData));

    // Check if username already exists
    console.log("Checking if username exists:", userData.username);
    const existingUser = await User.findOne({
      where: { username: userData.username },
    });
    if (existingUser) {
      console.log("Username already exists:", userData.username);
      return res.status(400).json({ error: "Username already exists" });
    }

    // Check if phone number already exists
    console.log("Checking if phone number exists:", userData.phoneNumber);
    const existingPhone = await User.findOne({
      where: { phoneNumber: userData.phoneNumber },
    });
    if (existingPhone) {
      console.log("Phone number already in use:", userData.phoneNumber);
      return res.status(400).json({ error: "Phone number already in use" });
    }

    // Generate a new BIGINT ID
    const newId =
      BigInt(Date.now()) * BigInt(1000) +
      BigInt(Math.floor(Math.random() * 1000));
    userData.id = newId.toString(); // Convert to string for JSON compatibility

    // Create new user
    console.log("Attempting to create new user with ID:", newId.toString());
    const newUser = await User.create(userData);
    console.log("New user created:", newUser.id);

    // Remove password from the response
    const { password, ...userWithoutPassword } = newUser.toJSON();

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Error creating user:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: error.stack,
    });
  }
});

app.patch("/users/:id/rate", async (req, res) => {
  const { id } = req.params;
  const { rating, taskId } = req.body;

  try {
    const user = await User.findByPk(id);
    const task = await Task.findByPk(taskId);

    if (!user || !task) {
      return res.status(404).json({ error: "User or task not found" });
    }

    user.ratings = user.ratings || [];
    user.ratings.push(rating);
    user.averageRating = parseFloat(
      (user.ratings.reduce((a, b) => a + b) / user.ratings.length).toFixed(2)
    );
    await user.save();

    task.rating = rating;
    await task.save();

    await createNotification(
      user.id,
      "New Rating Received",
      `You received a new rating of ${rating} for the task "${task.title}".`,
      taskId
    );

    res.json(user);
  } catch (error) {
    console.error("Error rating user:", error);
    res.status(500).json({ error: "Error rating user" });
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ where: { username } });
    if (user && user.password === password) {
      const { password, ...userWithoutPassword } = user.toJSON();
      res.json(userWithoutPassword);
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Task Routes
app.get("/tasks", async (req, res) => {
  try {
    const { userId, userType } = req.query;
    let whereClause = {};

    if (userType === "elderly") {
      whereClause.elderlyId = userId;
    }

    const tasks = await Task.findAll({ where: whereClause });
    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Error fetching tasks" });
  }
});

app.post("/tasks", async (req, res) => {
  try {
    const taskData = req.body;
    const newId =
      BigInt(Date.now()) * BigInt(1000) +
      BigInt(Math.floor(Math.random() * 1000));
    taskData.id = newId.toString();

    const newTask = await Task.create(taskData);
    const volunteers = await User.findAll({ where: { userType: "volunteer" } });

    for (const volunteer of volunteers) {
      await createNotification(
        volunteer.id,
        "New Task Available",
        `A new task "${newTask.title}" is available.`,
        newTask.id
      );
    }

    res.status(201).json(newTask);
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Error creating task" });
  }
});

app.patch("/tasks/:id", async (req, res) => {
  const taskId = req.params.id;
  const { status, volunteerId, elderlyConfirmed, rating } = req.body;

  try {
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    await task.update(req.body);

    if (status === "Accepted") {
      const volunteer = await User.findByPk(volunteerId);
      await createNotification(
        task.elderlyId,
        "Task Accepted",
        `Your task "${task.title}" has been accepted by ${volunteer.firstName} ${volunteer.lastName}.`,
        taskId
      );
    } else if (status === "Completed") {
      await createNotification(
        task.elderlyId,
        "Task Completed",
        `Your task "${task.title}" has been marked as completed. Please confirm and rate the volunteer.`,
        taskId
      );
      await createNotification(
        task.volunteerId,
        "Task Completed",
        `You have marked the task "${task.title}" as completed. Waiting for elderly confirmation.`,
        taskId
      );
    } else if (elderlyConfirmed && rating) {
      await createNotification(
        task.volunteerId,
        "Task Rated",
        `The task "${task.title}" has been confirmed completed and you've received a rating of ${rating}.`,
        taskId
      );
    }

    res.json({ success: true, message: "Task updated successfully" });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ success: false, message: "Error updating task" });
  }
});

app.patch("/tasks/:id/archive", async (req, res) => {
  const taskId = req.params.id;

  try {
    const task = await Task.findByPk(taskId);
    if (task && task.status === "Completed" && task.elderlyConfirmed) {
      await task.update({ archived: true });
      res.json({ success: true, message: "Task archived successfully" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Task cannot be archived" });
    }
  } catch (error) {
    console.error("Error archiving task:", error);
    res.status(500).json({ success: false, message: "Error archiving task" });
  }
});

// Message Routes
app.get("/tasks/:id/messages", async (req, res) => {
  const taskId = req.params.id;
  try {
    const messages = await Message.findAll({ where: { taskId: taskId } });
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Error fetching messages" });
  }
});

app.post("/tasks/:id/messages", async (req, res) => {
  const taskId = req.params.id;
  try {
    const messageData = req.body;
    const newId =
      BigInt(Date.now()) * BigInt(1000) +
      BigInt(Math.floor(Math.random() * 1000));
    messageData.id = newId.toString();
    messageData.taskId = taskId;

    const newMessage = await Message.create(messageData);
    const task = await Task.findByPk(taskId);
    const recipientId =
      newMessage.senderId === task.elderlyId
        ? task.volunteerId
        : task.elderlyId;

    await createNotification(
      recipientId,
      "New Message",
      `You have a new message in task "${task.title}".`,
      taskId
    );

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Error creating message" });
  }
});

// Notification Routes
app.get("/notifications", async (req, res) => {
  const { userId } = req.query;
  try {
    const notifications = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Error fetching notifications" });
  }
});

app.patch("/notifications/:id", async (req, res) => {
  const notificationId = req.params.id;
  try {
    const notification = await Notification.findByPk(notificationId);
    if (notification) {
      await notification.update({ read: true });
      res.json({ success: true, message: "Notification marked as read" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }
  } catch (error) {
    console.error("Error updating notification:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating notification" });
  }
});

app.delete("/notifications/:id", async (req, res) => {
  const notificationId = req.params.id;
  try {
    const notification = await Notification.findByPk(notificationId);
    if (notification) {
      await notification.destroy();
      res.json({ success: true, message: "Notification deleted successfully" });
    } else {
      res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting notification" });
  }
});

// File Upload Route
app.post("/uploads", (req, res) => {
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

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Default route
app.get("/", (req, res) => {
  res.send("ElderEase API is running");
});

// 404 handler
app.use((req, res) => {
  res.status(404).send("Not Found");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// Start the server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});

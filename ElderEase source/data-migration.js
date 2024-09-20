// data-migration.js
const { Sequelize, DataTypes } = require("sequelize");
const fs = require("fs");
require("dotenv").config();

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

async function migrateData() {
  try {
    console.log("Attempting to connect to the database...");
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    // Force update the schema
    await sequelize.sync({ force: true });
    console.log("Database schema updated.");

    // Read data from db.json
    const data = JSON.parse(fs.readFileSync("db.json", "utf8"));

    // Migrate users
    for (const user of data.users) {
      await User.create(user);
      console.log(`User ${user.username} migrated successfully.`);
    }
    // Migrate tasks
    for (const task of data.tasks) {
      await Task.create(task);
      console.log(`Task ${task.id} migrated successfully.`);
    }

    // Migrate messages
    for (const message of data.messages) {
      await Message.create(message);
      console.log(`Message ${message.id} migrated successfully.`);
    }

    // Migrate notifications
    for (const notification of data.notifications) {
      await Notification.create(notification);
      console.log(`Notification ${notification.id} migrated successfully.`);
    }

    console.log("Data migration completed successfully");
  } catch (error) {
    console.error("Error during data migration:", error);
  } finally {
    await sequelize.close();
  }
}

migrateData();
//

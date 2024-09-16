import React from "react";

const TaskList = ({ userType, onTaskClick, tasks, userId }) => {
  // Function to render task cards for a category
  const renderTaskCards = (tasks, title) => (
    <div className="mb-8" key={title}>
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="p-4 bg-white border rounded shadow-md cursor-pointer hover:bg-gray-100"
            onClick={() => onTaskClick(task)}
          >
            <h3 className="font-bold">{task.title}</h3>
            <p className="text-sm text-gray-600">
              Created: {new Date(task.createdAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">Status: {task.status}</p>
          </div>
        ))}
      </div>
    </div>
  );

  // Categorize tasks based on user type and task status
  const categorizedTasks =
    userType === "volunteer"
      ? {
          "New Tasks": tasks.filter((task) => task.status === "Open"),
          "Ongoing Tasks": tasks.filter(
            (task) => task.status === "Accepted" && task.volunteerId === userId
          ),
          "Awaiting Confirmation": tasks.filter(
            (task) =>
              task.status === "Completed" &&
              !task.elderlyConfirmed &&
              task.volunteerId === userId
          ),
          Archive: tasks.filter(
            (task) =>
              (task.status === "Archived" ||
                (task.status === "Completed" && task.elderlyConfirmed)) &&
              task.volunteerId === userId
          ),
        }
      : {
          "New Tasks": tasks.filter((task) => task.status === "Open"),
          "Ongoing Tasks": tasks.filter((task) => task.status === "Accepted"),
          "Completed Tasks": tasks.filter(
            (task) => task.status === "Completed" && !task.elderlyConfirmed
          ),
          Archive: tasks.filter(
            (task) =>
              task.status === "Archived" ||
              (task.status === "Completed" && task.elderlyConfirmed)
          ),
        };

  // Render the categorized task list
  return (
    <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 lg:grid-cols-2">
      {Object.entries(categorizedTasks).map(
        ([category, categoryTasks]) =>
          categoryTasks.length > 0 && renderTaskCards(categoryTasks, category)
      )}
    </div>
  );
};

export default TaskList;

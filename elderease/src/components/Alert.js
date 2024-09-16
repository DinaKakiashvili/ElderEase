import React from "react";

const Alert = ({ type, message }) => {
  const bgColor =
    type === "success"
      ? "bg-green-100 text-green-700"
      : "bg-red-100 text-red-700";

  return (
    <div className={`p-4 mb-4 rounded-md ${bgColor}`} role="alert">
      <p className="font-bold">{type === "success" ? "Success" : "Error"}</p>
      <p>{message}</p>
    </div>
  );
};

export default Alert;

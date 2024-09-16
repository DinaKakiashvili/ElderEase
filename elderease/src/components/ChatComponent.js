import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

const ChatComponent = ({ taskId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const API_BASE_URL = "http://localhost:3005";

  // Memoize fetchMessages to avoid recreating it on every render
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      } else {
        console.error("Failed to fetch messages");
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [taskId, API_BASE_URL]);

  // Effect to fetch messages and set up polling
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Poll for new messages every 5 seconds
    return () => clearInterval(interval);
  }, [fetchMessages]); // Add fetchMessages to the dependency array

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to send a new message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: user.id,
          senderName: `${user.firstName} ${user.lastName}`,
          content: newMessage,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setNewMessage("");
        fetchMessages();
      } else {
        console.error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Function to scroll to the bottom of the message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Render the chat component
  return (
    <div className="flex flex-col h-64 border rounded">
      {/* Message display area */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${
              message.senderId === user.id ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block p-2 rounded-lg ${
                message.senderId === user.id
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              <p className="text-sm font-bold">{message.senderName}</p>
              <p>{message.content}</p>
              <p className="text-xs text-gray-400">
                {new Date(message.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      {/* Message input form */}
      <form onSubmit={sendMessage} className="flex p-2 bg-gray-100">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 border rounded-l"
          placeholder="Type your message..."
        />
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-500 rounded-r"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;

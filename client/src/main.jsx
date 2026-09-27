import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import "./index.css";
import { useAuthStore } from "./store/authStore";

useAuthStore.getState().bootstrapFromStorage();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          borderRadius: "16px",
          background: "#0f172a",
          color: "#e2e8f0",
          boxShadow: "0 20px 50px rgba(15, 23, 42, 0.45)",
          border: "1px solid rgba(148, 163, 184, 0.12)",
        },
        success: {
          style: {
            background: "#0f766e",
            color: "#e0f2fe",
          },
        },
        error: {
          style: {
            background: "#991b1b",
            color: "#fee2e2",
          },
        },
      }}
    />
  </React.StrictMode>
);

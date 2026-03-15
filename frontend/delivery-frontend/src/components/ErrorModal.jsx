// ErrorModal.jsx
import React from "react";
import "../styles/ConfirmModal.css";

export default function ErrorModal({ isOpen, title, message, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          position: "relative",
          background: "#fff",
          borderRadius: "16px",
          padding: "25px 30px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 15px 35px rgba(0,0,0,0.3)",
          textAlign: "center",
        }}
      >
        {/* Крестик закрытия */}
        <button
          className="modal-close"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "10px",
            right: "15px",
            background: "transparent",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "#ef4444",
          }}
        >
          ×
        </button>

        {/* Заголовок */}
        <h3 style={{ color: "#ef4444", marginBottom: "12px" }}>{title}</h3>

        {/* Сообщение */}
        <p style={{ marginBottom: "20px", color: "#334155" }}>{message}</p>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import "./SendModal.css";

export default function SendModal({ selectedDocs = [], onClose, onSend }) {
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!recipient) {
      alert("Please enter recipient email");
      return;
    }
    onSend({ recipient, message, docs: selectedDocs });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Send Documents</h3>

        <div className="selected-docs">
          <strong>Selected Documents:</strong>
          {selectedDocs.length > 0 ? (
            <ul>
              {selectedDocs.map((doc) => (
                <li key={doc.id || doc.name}>{doc.name}</li>
              ))}
            </ul>
          ) : (
            <p>No documents selected</p>
          )}
        </div>

        <input
          type="email"
          placeholder="Recipient Email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />

        <textarea
          placeholder="Write a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}
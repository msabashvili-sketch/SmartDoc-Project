import React, { useState } from "react";
import "./SendModal.css";

export default function SendModal({ selectedDocs = [], onClose, onSend }) {
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contractChecked, setContractChecked] = useState(false);
  const [summaryChecked, setSummaryChecked] = useState(false);

  const handleSend = () => {
    if (!recipient) {
      alert("Please enter recipient email");
      return;
    }
    onSend({
      recipient,
      subject,
      message,
      contractChecked,
      summaryChecked,
      docs: selectedDocs,
    });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Title */}
        <h3 className="modal-title">Send Documents</h3>
        <div className="modal-underline"></div>

        {/* Send To Field */}
        <div className="modal-label">Send To</div>
        <input
          type="email"
          className="modal-input email-input"
          placeholder="Recipient Email"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />

        {/* Contract Checkbox Group */}
        <div className="modal-label">Contract</div>
        <div className="modal-checkbox-group">
          <label>
            <input
              type="checkbox"
              checked={contractChecked}
              onChange={() => setContractChecked(!contractChecked)}
            />
            Contract
          </label>
          <label>
            <input
              type="checkbox"
              checked={summaryChecked}
              onChange={() => setSummaryChecked(!summaryChecked)}
            />
            Summary
          </label>
        </div>

        {/* Subject Field */}
        <div className="modal-label">Subject</div>
        <textarea
          className="modal-textarea subject-textarea"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        {/* Message Field */}
        <div className="modal-label">Message</div>
        <textarea
          className="modal-textarea message-textarea"
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Buttons */}
        <div className="modal-actions">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="modal-btn modal-btn-send" onClick={handleSend}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
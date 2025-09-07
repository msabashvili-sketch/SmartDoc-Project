import React, { useState, useEffect, useMemo } from "react";
import "./SendModal.css";

export default function SendModal({ selectedRows = [], files = [], onClose }) {
  const [emails, setEmails] = useState([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contractChecked, setContractChecked] = useState(false);
  const [summaryChecked, setSummaryChecked] = useState(false);

  // Compute selected docs dynamically from current props
  const selectedDocs = useMemo(() => {
    return files
      .filter((file) => selectedRows.includes(file._id))
      .map((file) => ({ _id: file._id, filename: file.filename }));
  }, [selectedRows, files]);

  useEffect(() => {
    console.log("SendModal sees docs:", selectedDocs);
  }, [selectedDocs]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      const email = input.trim();
      if (validateEmail(email)) {
        setEmails([...emails, email]);
        setInput("");
      }
    }
  };

  const removeEmail = (index) => setEmails(emails.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (emails.length === 0) {
      alert("Please enter at least one recipient email");
      return;
    }

    if (!selectedDocs || selectedDocs.length === 0) {
      alert("No files selected to send");
      return;
    }

    const payload = {
      fileIds: selectedDocs.map((doc) => doc._id),
      recipients: emails,
      subject,
      message,
      sendContract: contractChecked,
      sendSummary: summaryChecked,
    };

    console.log("Sending payload:", payload);

    try {
      const response = await fetch("http://localhost:4000/api/send-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        alert("Email sent successfully!");
        onClose();
      } else {
        console.error("Send failed:", result);
        alert("Failed to send email: " + result.message);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Error sending email");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Send Documents</h3>
        <div className="modal-underline"></div>

        <div className="modal-label">Selected Files</div>
        <ul>
          {selectedDocs.length > 0 ? (
            selectedDocs.map((doc) => <li key={doc._id}>{doc.filename}</li>)
          ) : (
            <li>No files selected</li>
          )}
        </ul>

        <div className="modal-label">Send To</div>
        <div className="email-chips-container">
          {emails.map((email, index) => (
            <div className="email-chip" key={index}>
              {email}
              <span className="remove-chip" onClick={() => removeEmail(index)}>×</span>
            </div>
          ))}
          <input
            type="text"
            className="email-chips-input"
            placeholder={emails.length === 0 ? "Recipient Email" : ""}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="modal-label">Document Type</div>
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
              disabled
            />
            Summary (Coming Soon)
          </label>
        </div>

        <div className="modal-label">Subject</div>
        <textarea
          className="modal-textarea subject-textarea"
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <div className="modal-label">Message</div>
        <textarea
          className="modal-textarea message-textarea"
          placeholder="Write your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="modal-actions">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn modal-btn-send" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}
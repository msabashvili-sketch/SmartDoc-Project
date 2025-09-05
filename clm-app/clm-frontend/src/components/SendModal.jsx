import React, { useState } from "react";
import "./SendModal.css";

export default function SendModal({ selectedDocs = [], onClose }) {
  const [emails, setEmails] = useState([]); // store multiple emails
  const [input, setInput] = useState(""); // typing new email
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contractChecked, setContractChecked] = useState(false);
  const [summaryChecked, setSummaryChecked] = useState(false);

  // validate email format
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // handle Enter or comma press for email chips
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

  // remove email chip
  const removeEmail = (index) => {
    setEmails(emails.filter((_, i) => i !== index));
  };

  // send documents
  const handleSend = async () => {
    if (emails.length === 0) {
      alert("Please enter at least one recipient email");
      return;
    }

    // Filter docs by checkbox selection
    const docsToSend = selectedDocs.filter((doc) => {
      if (contractChecked && doc.type === "original") return true;
      if (summaryChecked && doc.type === "summary") return true;
      return false;
    });

    if (docsToSend.length === 0) {
      alert("Please select at least one document type (Contract / Summary)");
      return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append("recipients", emails.join(","));
    formData.append("subject", subject);
    formData.append("message", message);

    docsToSend.forEach((doc) => {
      formData.append("files", doc.file); // doc.file is a File object from input
    });

    try {
      const response = await fetch("/api/send-docs", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        alert("Email sent successfully!");
        onClose();
      } else {
        alert("Failed to send email: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Error sending email");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Title */}
        <h3 className="modal-title">Send Documents</h3>
        <div className="modal-underline"></div>

        {/* Send To Field */}
        <div className="modal-label">Send To</div>
        <div className="email-chips-container">
          {emails.map((email, index) => (
            <div className="email-chip" key={index}>
              {email}
              <span className="remove-chip" onClick={() => removeEmail(index)}>
                ×
              </span>
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
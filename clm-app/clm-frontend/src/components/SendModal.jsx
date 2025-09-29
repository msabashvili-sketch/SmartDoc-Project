import React, { useState } from "react";
import "./SendModal.css";

export default function SendModal({ selectedDocs = [], onClose }) {
  const [emails, setEmails] = useState([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contractChecked, setContractChecked] = useState(false);
  const [summaryChecked, setSummaryChecked] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Email validation
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Add email on Enter or comma
  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      const email = input.trim();
      if (validateEmail(email)) {
        setEmails([...emails, email]);
        setInput("");
      } else {
        alert("Invalid email address");
      }
    }
  };

  const removeEmail = (index) => setEmails(emails.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (!selectedDocs || selectedDocs.length === 0) {
      alert("No files selected to send");
      return;
    }
    if (emails.length === 0) {
      alert("Please enter at least one recipient email");
      return;
    }

    setIsSending(true);

    const formData = new FormData();
    formData.append("recipients", JSON.stringify(emails));
    formData.append("subject", subject);
    formData.append("message", message);
    formData.append("sendContract", contractChecked);
    formData.append("sendSummary", summaryChecked);

    selectedDocs.forEach((doc) => {
      if (doc.content) {
        let fileData;
        if (typeof doc.content === "string" && doc.content.startsWith("data:")) {
          // Convert base64 to Blob
          const byteString = atob(doc.content.split(",")[1]);
          const mimeString = doc.content.split(",")[0].split(":")[1].split(";")[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          fileData = new Blob([ab], { type: mimeString });
        } else {
          fileData = doc.content;
        }
        formData.append("files", fileData, doc.filename);
      }
    });

    try {
      const res = await fetch("http://localhost:4000/api/send-docs", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (result.success) {
        alert("Email sent successfully!");
        onClose();
      } else {
        alert("Failed to send email: " + result.message);
      }
    } catch (err) {
      console.error(err);
      alert("Error sending email");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title">Send Documents</h3>
        <div className="modal-underline"></div>

        <div className="modal-label">Selected Files</div>
        <ul>
          {selectedDocs.length > 0
            ? selectedDocs.map((doc) => <li key={doc._id}>{doc.filename}</li>)
            : <li>No files selected</li>}
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
          <button
            className="modal-btn modal-btn-cancel"
            onClick={onClose}
            disabled={isSending}
          >
            Cancel
          </button>
          <button
            className="modal-btn modal-btn-send"
            onClick={handleSend}
            disabled={isSending}
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
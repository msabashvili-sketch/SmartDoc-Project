import React, { useState, useMemo } from "react";
import "./SendModal.css";

export default function SendModal({ selectedRows = [], files = [], onClose }) {
  const [emails, setEmails] = useState([]);
  const [input, setInput] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [contractChecked, setContractChecked] = useState(false);
  const [summaryChecked, setSummaryChecked] = useState(false);

  // Get selected docs with actual file content
  const selectedDocs = useMemo(() => {
    return files
      .filter(file => selectedRows.includes(file._id))
      .map(file => ({
        _id: file._id,
        filename: file.filename,
        // Make sure `file.content` is either a Blob/File or Base64 string
        content: file.content || null
      }));
  }, [selectedRows, files]);

  const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleKeyDown = e => {
    if ((e.key === "Enter" || e.key === ",") && input.trim()) {
      e.preventDefault();
      const email = input.trim();
      if (validateEmail(email)) {
        setEmails([...emails, email]);
        setInput("");
      }
    }
  };

  const removeEmail = index => setEmails(emails.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (emails.length === 0) {
      alert("Please enter at least one recipient email");
      return;
    }

    if (!selectedDocs || selectedDocs.length === 0) {
      alert("No files selected to send");
      return;
    }

    // Using FormData to send files as attachments
    const formData = new FormData();
    formData.append("recipients", JSON.stringify(emails));
    formData.append("subject", subject);
    formData.append("message", message);
    formData.append("sendContract", contractChecked);
    formData.append("sendSummary", summaryChecked);

    selectedDocs.forEach(doc => {
      if (doc.content) {
        // If content is Base64 string, convert to Blob first
        let fileData;
        if (typeof doc.content === "string") {
          const byteString = atob(doc.content.split(",")[1] || doc.content);
          const mimeString = doc.content.split(",")[0]?.split(":")[1]?.split(";")[0] || "application/octet-stream";
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          fileData = new Blob([ab], { type: mimeString });
        } else {
          fileData = doc.content; // already Blob/File
        }

        formData.append("files", fileData, doc.filename);
      }
    });

    try {
      const response = await fetch("http://localhost:4000/api/send-docs", {
        method: "POST",
        body: formData,
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
          {selectedDocs.length > 0
            ? selectedDocs.map(doc => <li key={doc._id}>{doc.filename}</li>)
            : <li>No files selected</li>
          }
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
            onChange={e => setInput(e.target.value)}
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
          onChange={e => setSubject(e.target.value)}
        />

        <div className="modal-label">Message</div>
        <textarea
          className="modal-textarea message-textarea"
          placeholder="Write your message..."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />

        <div className="modal-actions">
          <button className="modal-btn modal-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="modal-btn modal-btn-send" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}
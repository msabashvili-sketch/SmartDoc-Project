import React, { useState } from "react";
import "./UploadFilesPopup.css";

export default function UploadFilesPopup({ isOpen, onCancel, onBack }) {
  const [files, setFiles] = useState([]);

  if (!isOpen) return null;

  // Drag & drop files
  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleBrowse = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  // Upload to backend
  const handleUploadFiles = async () => {
    if (!files.length) return alert("Please select files first.");

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("http://localhost:4000/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Uploaded files:", data.files);
      alert("Files uploaded successfully!");
      setFiles([]); // Clear after upload
      onCancel(); // Close popup if needed
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading files.");
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-window">
        <h2 className="popup-title">Upload documents</h2>

        {/* Drop area */}
        <div
          className="drop-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <p>
            Drag and drop files here or{" "}
            <span className="browse-link">browse files</span>
          </p>
          <input type="file" multiple onChange={handleBrowse} />
        </div>

        {/* Footer buttons */}
        <div className="popup-footer">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="back-btn" onClick={onBack}>
            Back
          </button>
          <button className="import-btn" onClick={handleUploadFiles}>
            Import
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import "./UploadFilesPopup.css";

export default function UploadFilesPopup({ isOpen, onCancel, onBack }) {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  // Helper: pick icon depending on file type
  const getFileIcon = (file) => {
    if (file.type.includes("pdf")) return "/assets/pdf-icon.png";
    if (file.type.includes("image")) return "/assets/image-icon.png";
    if (file.type.includes("word")) return "/assets/word-icon.png";
    return "/assets/file-icon.png";
  };

  // Drag & drop handlers
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

  // Upload with smooth 0-95% progress, then 100%
  const handleUploadFiles = async () => {
    if (!files.length) return alert("Please select files first.");

    setIsUploading(true);
    setUploadProgress(0);
    let progress = 0;

    // Start smooth progress interval
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const next = prev + Math.random() * 5;
        return next >= 95 ? 95 : next;
      });
    }, 100);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const res = await fetch("http://localhost:4000/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("Uploaded files:", data.files);

      // Complete progress to 100% and clear interval
      clearInterval(interval);
      setUploadProgress(100);

      setTimeout(() => {
        alert("Files uploaded successfully!");
        setFiles([]);
        setIsUploading(false);
        setUploadProgress(0);
        onCancel();
      }, 500);
    } catch (err) {
      clearInterval(interval);
      console.error("Upload error:", err);
      alert("Error uploading files.");
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-window">
        <h2 className="popup-title">Upload documents</h2>

        {/* Progress bar */}
        {isUploading && (
          <div className="upload-progress-bar">
            <div
              className="upload-progress-fill"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        {/* Drop area */}
        <div
          className="drop-area"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {files.length === 0 ? (
            <p>
              Drag and drop files here or{" "}
              <span className="browse-link">browse files</span>
            </p>
          ) : (
            <div className="file-icons-container">
              {files.map((file, idx) => {
                const size = Math.max(300 - files.length * 35, 75);

                let maxNameLength;
                if (size >= 250) maxNameLength = 40;
                else if (size >= 150) maxNameLength = 23;
                else if (size >= 80) maxNameLength = 17;
                else maxNameLength = 8;

                const displayName =
                  file.name.length > maxNameLength
                    ? file.name.slice(0, maxNameLength) + "..."
                    : file.name;

                return (
                  <div key={idx} className="file-item">
                    <img
                      src={getFileIcon(file)}
                      alt={file.name}
                      className="file-icon"
                      style={{ width: `${size}px`, height: `${size}px` }}
                    />
                    <p className="file-name" title={file.name} style={{ maxWidth: `${size}px` }}>
                      {displayName}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
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
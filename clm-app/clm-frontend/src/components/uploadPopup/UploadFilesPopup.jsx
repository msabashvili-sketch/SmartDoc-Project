import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./UploadFilesPopup.css";

export default function UploadFilesPopup({ isOpen, onCancel, onBack, isSmartImport }) {
  const { t } = useTranslation();
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false); // Drag state for upload effect

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
    setIsDragging(false);
  };

  const handleBrowse = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  // Upload function
  const handleUploadFiles = async () => {
    if (!files.length) return alert(t("uploadfilespopup.select_files_first"));

    setIsUploading(true);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const next = prev + Math.random() * 5;
        return next >= 95 ? 95 : next;
      });
    }, 100);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    // <-- Send isSmartImport flag to backend
    formData.append("isSmartImport", isSmartImport);

    try {
      const res = await fetch("http://localhost:4000/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("Uploaded files:", data.files);

      clearInterval(interval);
      setUploadProgress(100);
      setUploadedFiles(files);

      setTimeout(() => {
        setFiles([]);
        setUploadedFiles([]);
        setIsUploading(false);
        setUploadProgress(0);
        onCancel();
      }, 2000);
    } catch (err) {
      clearInterval(interval);
      console.error("Upload error:", err);
      alert(t("uploadfilespopup.upload_error"));
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-window">
        <h2 className="popup-title">{t("uploadfilespopup.upload_documents")}</h2>

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
          className={`drop-area ${isDragging ? "dragging" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {/* Drop area header */}
          <div className="drop-area-header">
            <span className="file-count">
              {files.length === 0
                ? t("uploadfilespopup.no_files")
                : t("uploadfilespopup.files_selected", { count: files.length })}
            </span>
            <label className="add-more-label">
              + {t("uploadfilespopup.add_more")}
              <input
                type="file"
                multiple
                onChange={handleBrowse}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {/* Drop area content */}
          {files.length === 0 ? (
            <div className="drop-area-placeholder">
              {isDragging ? (
                <div className="upload-icon-wrapper">
                  <img
                    src="/assets/upload-icon.png"
                    alt="Upload"
                    style={{ width: "200px", height: "200px" }}
                    className="upload-icon"
                  />
                </div>
              ) : (
                <>
                  {t("uploadfilespopup.drag_drop_or")}{" "}
                  <label className="browse-link">
                    {t("uploadfilespopup.browse_files")}
                    <input
                      type="file"
                      multiple
                      onChange={handleBrowse}
                      style={{ display: "none" }}
                    />
                  </label>
                </>
              )}
            </div>
          ) : (
            <div className="file-icons-container">
              {files.map((file, idx) => {
                const size = Math.max(260 - files.length * 27, 90);

                let maxNameLength;
                if (size >= 250) maxNameLength = 36;
                else if (size >= 200) maxNameLength = 31;
                else if (size >= 150) maxNameLength = 25;
                else if (size >= 80) maxNameLength = 17;
                else maxNameLength = 8;

                const displayName =
                  file.name.length > maxNameLength
                    ? file.name.slice(0, maxNameLength) + "..."
                    : file.name;

                const handleRemoveFile = () => {
                  setFiles((prev) => prev.filter((_, i) => i !== idx));
                };

                const isDone = uploadedFiles.includes(file);

                return (
                  <div key={idx} className="file-item">
                    <div
                      className="file-icon-wrapper"
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        position: "relative",
                      }}
                    >
                      <img
                        src={getFileIcon(file)}
                        alt={file.name}
                        className="file-icon"
                        style={{ width: `${size}px`, height: `${size}px` }}
                      />

                      {isUploading && !isDone && (
                        <div className="upload-overlay">
                          <div className="upload-spinner"></div>
                        </div>
                      )}

                      <button
                        className="remove-file-btn"
                        onClick={handleRemoveFile}
                        style={{
                          position: "absolute",
                          top: "-0px",
                          right: "-0px",
                          transform: "translate(35%, -35%)",
                          width: `${size * 0.1}px`,
                          height: `${size * 0.1}px`,
                          border: "none",
                          borderRadius: "50%",
                          background: "transparent",
                          padding: 0,
                          cursor: "pointer",
                        }}
                        disabled={isUploading && !isDone}
                        title={
                          isDone
                            ? t("uploadfilespopup.uploaded")
                            : t("uploadfilespopup.remove")
                        }
                      >
                        <img
                          src={
                            isDone
                              ? "/assets/check-icon.png"
                              : "/assets/cancel-icon.png"
                          }
                          alt={
                            isDone
                              ? t("uploadfilespopup.uploaded")
                              : t("uploadfilespopup.remove")
                          }
                          style={{ width: "100%", height: "100%" }}
                        />
                      </button>
                    </div>
                    <p
                      className="file-name"
                      title={file.name}
                      style={{ maxWidth: `${size}px` }}
                    >
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
            {t("uploadfilespopup.cancel")}
          </button>
          <button className="back-btn" onClick={onBack}>
            {t("uploadfilespopup.back")}
          </button>
          <button className="import-btn" onClick={handleUploadFiles}>
            {t("uploadfilespopup.import")}
          </button>
        </div>
      </div>
    </div>
  );
}
// src/components/RepositoryDetailsPanel.jsx
import React, { useState, useEffect } from "react";
import "./RepositoryDetailsPanel.css";
import { useTranslation } from "react-i18next";

export default function RepositoryDetailsPanel({
  isOpen,
  file,
  onClose,
  onDelete,
  onArchive,
  showSendButton = true,
  footerButtonClass = "",
  onOpenTextViewer, // ✅ new prop
}) {
  const { t } = useTranslation();
  const [selectedSection, setSelectedSection] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const metadata = file?.metadata || {};

  if (!file) return null;

  const getScannedDocUrl = () => {
    if (metadata.scannedDocUrl) return metadata.scannedDocUrl;
    if (metadata.scannedDocId)
      return `http://localhost:4000/api/documents/view/${metadata.scannedDocId}`;
    if (file.id)
      return `http://localhost:4000/api/documents/view/${file.id}`;
    return null;
  };

  const handleSendToArchive = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/documents/send-to-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: [file.id] }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      await res.json();

      if (onArchive) onArchive(file.id);
      alert(t("detailspanel.archiveSuccess") || "File sent to archive successfully!");
      onClose();
    } catch (err) {
      console.error("❌ Error archiving file:", err);
      alert(t("detailspanel.archiveError") || "Error sending file to archive.");
    }
  };

  return (
    <>
      <div className={`details-panel ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="details-panel-header">
          <div className="details-title-container">
            <h2 className="details-title">{file.filename}</h2>
          </div>
          <button className="repository-details-cancel" onClick={onClose}>×</button>
        </div>

        {/* Content */}
        <div className="details-panel-content">
          {/* Dates */}
          <div className="repository-details-subtitle">{t("detailspanel.dates")}</div>
          <div className="details-field">
            <span className="details-field-label">{t("detailspanel.agreementDate")}</span>
            <div className="details-field-divider"></div>
            <span className="details-field-value">{metadata.agreementDate || file.agreementDate || "-"}</span>
          </div>
          <div className="details-field">
            <span className="details-field-label">{t("detailspanel.expiryDate")}</span>
            <div className="details-field-divider"></div>
            <span className="details-field-value">{metadata.expiryDate || file.expiryDate || "-"}</span>
          </div>

          {/* Document Section */}
          <div className="repository-details-secondsubtitle">{t("detailspanel.document")}</div>
          <div className="stacked-documents">

            {/* ✅ Text Version Field */}
            <div
              className={`details-field-section ${selectedSection === "text" ? "selected" : ""}`}
              onClick={() => {
                setSelectedSection("text");
                onClose(); // close side panel
                if (onOpenTextViewer) onOpenTextViewer(file); // open new slide-in viewer
              }}
            >
              <div className="doc-field">
                <img
                  src="/assets/document-icon-20.svg"
                  alt="doc"
                  className="document-icon"
                />
                <div className="doc-text">
                  <span className="details-field-section-label">
                    {t("detailspanel.textVersion")}
                  </span>
                  <span className="details-field-section-value">
                    {metadata.textDocName || t("detailspanel.notAvailable")}
                  </span>
                </div>
              </div>
            </div>

            {/* ✅ Scanned Document Field */}
            <div
              className={`details-field-section ${selectedSection === "scanned" ? "selected" : ""}`}
              onClick={() => {
                setSelectedSection("scanned");
                const url = getScannedDocUrl();
                if (url) window.open(url, "_blank");
                else alert(t("detailspanel.noScannedDoc"));
              }}
            >
              <div className="doc-field">
                <img
                  src="/assets/document-icon-20.svg"
                  alt="doc"
                  className="document-icon"
                />
                <div className="doc-text">
                  <span className="details-field-section-label">
                    {t("detailspanel.scannedDocument")}
                  </span>
                  <span className="details-field-section-value">
                    {metadata.scannedDocName ||
                      (metadata.scannedDocId || file.id
                        ? file.filename
                        : t("detailspanel.notAvailable"))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="repository-details-secondsubtitle">
            {t("detailspanel.contactInfo")}
          </div>
          <div className="details-field">
            <span className="details-field-label">{t("detailspanel.email")}</span>
            <div className="details-field-divider"></div>
            <span className="details-field-value">{metadata.email || "-"}</span>
          </div>
          <div className="details-field">
            <span className="details-field-label">{t("detailspanel.phone")}</span>
            <div className="details-field-divider"></div>
            <span className="details-field-value">{metadata.phone || "-"}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="details-panel-footer">
          {showSendButton && (
            <button
              className={`archive-btn ${footerButtonClass}`}
              onClick={handleSendToArchive}
            >
              {t("detailspanel.Send to Archive")}
            </button>
          )}
          <button
            className={`delete-btn ${footerButtonClass}`}
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t("detailspanel.Delete")}
          </button>
        </div>

        {/* Delete Confirmation Popup */}
        {showDeleteConfirm && (
          <div
            className="confirm-overlay"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="confirm-box"
              onClick={(e) => e.stopPropagation()}
            >
              <p>{t("detailspanel.confirmDelete")}</p>
              <div className="confirm-actions">
                <button
                  className="confirm-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  {t("detailspanel.cancel")}
                </button>
                <button
                  className="confirm-delete"
                  onClick={() => {
                    onDelete(file.id);
                    setShowDeleteConfirm(false);
                    onClose();
                  }}
                >
                  {t("detailspanel.Delete")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./RepositoryDetailsPanel.css";
import { useTranslation } from "react-i18next";

export default function RepositoryDetailsPanel({ isOpen, file, onClose, onDelete }) {
  const { t } = useTranslation();
  const [selectedSection, setSelectedSection] = useState(null);
  const [showTextPopup, setShowTextPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!file) return null;

  const getScannedDocUrl = () => {
    if (file.metadata?.scannedDocUrl) return file.metadata.scannedDocUrl;
    if (file.metadata?.scannedDocId) {
      return `http://localhost:4000/api/documents/view/${file.metadata.scannedDocId}`;
    }
    return null;
  };

  return (
    <>
      <div className={`details-panel ${isOpen ? "open" : ""}`}>
        {/* Header */}
        <div className="details-panel-header">
          <div className="details-title-container">
            <h2 className="details-title">{file.filename}</h2>
          </div>
          <button className="repository-details-cancel" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Content */}
        <div className="details-panel-content">
          {/* Dates */}
          <div className="repository-details-subtitle">{t("detailspanel.dates")}</div>
          <div className="details-field">
            <span className="details-field-label">{t("detailspanel.agreementDate")}</span>
            <div className="details-field-divider"></div>
            <span className="details-field-value">
              {file.metadata?.agreementDate || "-"}
            </span>
          </div>
          <div className="details-field">
            <span className="details-field-label">{t("detailspanel.expiryDate")}</span>
            <div className="details-field-divider"></div>
            <span className="details-field-value">
              {file.metadata?.expiryDate || "-"}
            </span>
          </div>

          {/* Document Section */}
          <div className="repository-details-secondsubtitle">{t("detailspanel.document")}</div>
          <div className="stacked-documents">
            {/* Text Version (open popup fullscreen) */}
            <div
              className={`details-field-section ${selectedSection === "text" ? "selected" : ""}`}
              onClick={() => {
                setSelectedSection("text");
                setShowTextPopup(true);
              }}
            >
              <span className="details-field-section-label">{t("detailspanel.textVersion")}</span>
              <span className="details-field-section-value">
                {file.metadata?.textDocName || t("detailspanel.notAvailable")}
              </span>
            </div>

            {/* Scanned Document */}
            <div
              className={`details-field-section ${selectedSection === "scanned" ? "selected" : ""}`}
              onClick={() => {
                setSelectedSection("scanned");
                const url = getScannedDocUrl();
                if (url) {
                  window.open(url, "_blank");
                } else {
                  alert(t("detailspanel.noScannedDoc"));
                }
              }}
            >
              <span className="details-field-section-label">{t("detailspanel.scannedDocument")}</span>
              <span className="details-field-section-value">
                {file.metadata?.scannedDocName || t("detailspanel.notAvailable")}
              </span>
            </div>
          </div>

          {/* Contact Info */}
          <div className="repository-details-secondsubtitle">{t("detailspanel.contactInfo")}</div>
          <div className="details-field">
            <span className="details-field-label">{t("detailspanel.email")}</span>
            <div className="details-field-divider"></div>
            <span className="details-field-value">{file.metadata?.email || "-"}</span>
          </div>
          <div className="details-field">
            <span className="details-field-label">{t("detailspanel.phone")}</span>
            <div className="details-field-divider"></div>
            <span className="details-field-value">{file.metadata?.phone || "-"}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="details-panel-footer">
          <button className="archive-btn">{t("detailspanel.Send to Archive")}</button>
          <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)}>
            {t("detailspanel.Delete")}
          </button>
        </div>

        {/* Delete Confirmation Popup (INSIDE panel) */}
        {showDeleteConfirm && (
          <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
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
                    onDelete(file._id);
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

      {/* Text Version Popup (FULLSCREEN via Portal) */}
      {showTextPopup &&
        ReactDOM.createPortal(
          <div className="text-popup-overlay" onClick={() => setShowTextPopup(false)}>
            <div className="text-popup-content" onClick={(e) => e.stopPropagation()}>
              <button className="popup-close" onClick={() => setShowTextPopup(false)}>
                X
              </button>
              <iframe
                src={file.metadata?.textDocUrl}
                title="Text Document"
                width="100%"
                height="100%"
                style={{ border: "none" }}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
import React, { useState } from "react";
import "./RepositoryDetailsPanel.css";
import { useTranslation } from "react-i18next";

export default function RepositoryDetailsPanel({ isOpen, file, onClose }) {
  const { t } = useTranslation();
  const [selectedSection, setSelectedSection] = useState(null);
  const [showTextPopup, setShowTextPopup] = useState(false);

  if (!file) return null; // don't render without data

  // Build scanned document URL using ID if url not present
  const getScannedDocUrl = () => {
    if (file.metadata?.scannedDocUrl) return file.metadata.scannedDocUrl;
    if (file.metadata?.scannedDocId) {
      return `http://localhost:4000/api/documents/view/${file.metadata.scannedDocId}`;
    }
    return null;
  };

  return (
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
        
         {/* First subtitle */}
  <div className="repository-details-subtitle">
    {t("detailspanel.dates")}
  </div>

        {/* Agreement Date field */}
        <div className="details-field">
          <span className="details-field-label">{t("detailspanel.agreementDate")}</span>
          <div className="details-field-divider"></div>
          <span className="details-field-value">
            {file.metadata?.agreementDate || "-"}
          </span>
        </div>

        {/* Expiry Date field */}
        <div className="details-field">
          <span className="details-field-label">{t("detailspanel.expiryDate")}</span>
          <div className="details-field-divider"></div>
          <span className="details-field-value">
            {file.metadata?.expiryDate || "-"}
          </span>
        </div>

        {/* Second section subtitle */}
        <div className="repository-details-secondsubtitle">{t("detailspanel.document")}</div>

        {/* Stacked document field with common border */}
        <div className="stacked-documents">
          {/* Text Version - Popup */}
          <div
            className={`details-field-section ${
              selectedSection === "text" ? "selected" : ""
            }`}
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

          {/* Scanned Document - New Tab */}
          <div
            className={`details-field-section ${
              selectedSection === "scanned" ? "selected" : ""
            }`}
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

        {/* Third subtitle */}
        <div className="repository-details-secondsubtitle">{t("detailspanel.contactInfo")}</div>

        {/* Contact info field (styled like dates) */}
        <div className="details-field">
          <span className="details-field-label">{t("detailspanel.email")}</span>
          <div className="details-field-divider"></div>
          <span className="details-field-value">
            {file.metadata?.email || "-"}
          </span>
        </div>

        {/* Phone field */}
        <div className="details-field">
          <span className="details-field-label">{t("detailspanel.phone")}</span>
          <div className="details-field-divider"></div>
          <span className="details-field-value">
            {file.metadata?.phone || "-"}
          </span>
        </div>
      </div>

      {/* Footer with buttons */}
      <div className="details-panel-footer">
        <button className="archive-btn">{t("detailspanel.Send to Archive")}</button>
        <button className="delete-btn">{t("detailspanel.Delete")}</button>
      </div>

      {/* Text Version Popup */}
      {showTextPopup && (
        <div
          className="text-popup-overlay"
          onClick={() => setShowTextPopup(false)}
        >
          <div
            className="text-popup-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="popup-close"
              onClick={() => setShowTextPopup(false)}
            >
              ×
            </button>
            <iframe
              src={file.metadata?.textDocUrl}
              title="Text Document"
              width="100%"
              height="100%"
              style={{ border: "none" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
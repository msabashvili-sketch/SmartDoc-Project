// src/components/RepositoryDetailsPanel.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./RepositoryDetailsPanel.css";
import { useTranslation } from "react-i18next";

export default function RepositoryDetailsPanel({
  isOpen,
  file,
  onClose,
  onDelete,
  onArchive,
  showSendButton = true, // ✅ control "Send to Archive" button
  footerButtonClass = "", // ✅ class for footer buttons (small size)
}) {
  const { t } = useTranslation();
  const [selectedSection, setSelectedSection] = useState(null);
  const [showTextPopup, setShowTextPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [loadingText, setLoadingText] = useState(false);

  // Fetch text content
  useEffect(() => {
    if (showTextPopup && file?.metadata?.textDocId) {
      const textId = file.metadata.textDocId;
      setLoadingText(true);

      fetch(`http://localhost:4000/api/documents/view/${textId}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.text();
        })
        .then(data => setTextContent(data))
        .catch(() => setTextContent(t("detailspanel.notAvailable")))
        .finally(() => setLoadingText(false));
    } else {
      setTextContent("");
    }
  }, [showTextPopup, file, t]);

  if (!file) return null;

  const getScannedDocUrl = () => {
    if (file.metadata?.scannedDocUrl) return file.metadata.scannedDocUrl;
    if (file.metadata?.scannedDocId)
      return `http://localhost:4000/api/documents/view/${file.metadata.scannedDocId}`;
    return null;
  };

  const renderPages = () => {
    if (!textContent) return null;
    const lines = textContent.split("\n");
    const pageSize = 55;
    const pages = [];
    for (let i = 0; i < lines.length; i += pageSize) {
      pages.push(lines.slice(i, i + pageSize));
    }
    return pages.map((pageLines, idx) => (
      <div key={idx} className="page">
        {pageLines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    ));
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
            <span className="details-field-value">{file.metadata?.agreementDate || "-"}</span>
          </div>
          <div className="details-field">
            <span className="details-field-label">{t("detailspanel.expiryDate")}</span>
            <div className="details-field-divider"></div>
            <span className="details-field-value">{file.metadata?.expiryDate || "-"}</span>
          </div>

          {/* Document Section */}
          <div className="repository-details-secondsubtitle">{t("detailspanel.document")}</div>
          <div className="stacked-documents">
            <div
              className={`details-field-section ${selectedSection === "text" ? "selected" : ""}`}
              onClick={() => { setSelectedSection("text"); setShowTextPopup(true); }}
            >
              <span className="details-field-section-label">{t("detailspanel.textVersion")}</span>
              <span className="details-field-section-value">
                {file.metadata?.textDocName || t("detailspanel.notAvailable")}
              </span>
            </div>

            <div
              className={`details-field-section ${selectedSection === "scanned" ? "selected" : ""}`}
              onClick={() => {
                setSelectedSection("scanned");
                const url = getScannedDocUrl();
                if (url) window.open(url, "_blank");
                else alert(t("detailspanel.noScannedDoc"));
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
          {showSendButton && (
            <button className={`archive-btn ${footerButtonClass}`} onClick={handleSendToArchive}>
              {t("detailspanel.Send to Archive")}
            </button>
          )}
          <button className={`delete-btn ${footerButtonClass}`} onClick={() => setShowDeleteConfirm(true)}>
            {t("detailspanel.Delete")}
          </button>
        </div>

        {/* Delete Confirmation Popup */}
        {showDeleteConfirm && (
          <div className="confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
              <p>{t("detailspanel.confirmDelete")}</p>
              <div className="confirm-actions">
                <button className="confirm-cancel" onClick={() => setShowDeleteConfirm(false)}>
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

      {/* Text Popup */}
      {showTextPopup &&
        ReactDOM.createPortal(
          <div className="text-popup-overlay" onClick={() => setShowTextPopup(false)}>
            <div className="text-popup-content" onClick={(e) => e.stopPropagation()}>
              <button className="popup-close" onClick={() => setShowTextPopup(false)}>X</button>
              <div className="split-layout">
                <div className="popup-left">
                  {loadingText ? <div className="loading">{t("detailspanel.loading") || "Loading..."}</div> : renderPages()}
                </div>
                <div className="popup-right">
                  <h3>{t("detailspanel.tags")}</h3>
                  <ul>
                    {(file.metadata?.aiTags || []).map((tag, idx) => (
                      <li key={idx}>{tag.tag}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
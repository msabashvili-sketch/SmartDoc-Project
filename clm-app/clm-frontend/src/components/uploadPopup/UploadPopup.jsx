import React, { useState } from "react";
import "./UploadPopup.css";
import UploadFilesPopup from "./UploadFilesPopup";

export default function UploadPopup({ isOpen, onClose, handleUpload, uploadedImage }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFilesPopupOpen, setIsFilesPopupOpen] = useState(false);

  if (!isOpen) return null;

  const handleCancelBoth = () => {
    setIsFilesPopupOpen(false);
    onClose(); // closes main UploadPopup
  };

  const handleBack = () => {
    setIsFilesPopupOpen(false); // closes only files popup
  };

  return (
    <>
      {/* Only show overlay for main popup if files popup is not open */}
      {!isFilesPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-window">
            <h2 className="popup-title">Upload documents</h2>

            {/* Smart Import option */}
            <div
              className={`upload-option large ${
                selectedOption === "smart" ? "active" : ""
              }`}
              onClick={() => setSelectedOption("smart")}
            >
              <div className="option-header">
                <div className="toggle-circle"></div>
                <span>Smart import</span>
              </div>

              <p className="option-description">
                Save time by using smart import AI models to scan text and automatically detect and tag key pieces of data during upload. Records will be instantly searchable and filterable.
              </p>

              <div className="logo-upload" onClick={handleUpload}>
                {uploadedImage ? (
                  <img
                    src={uploadedImage}
                    alt="Brand Logo Preview"
                    className="logo-preview"
                  />
                ) : (
                  <div className="logo-placeholder">
                    Click to upload brand logo
                  </div>
                )}
              </div>
            </div>

            {/* Import option */}
            <div
              className={`upload-option small ${
                selectedOption === "import" ? "active" : ""
              }`}
              onClick={() => setSelectedOption("import")}
            >
              <div className="option-header">
                <div className="toggle-circle"></div>
                <span>Import</span>
              </div>
            </div>

            <div className="popup-footer">
              <button className="cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                className="select-btn"
                onClick={() => setIsFilesPopupOpen(true)}
              >
                Select files
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UploadFilesPopup */}
      <UploadFilesPopup
        isOpen={isFilesPopupOpen}
        onCancel={handleCancelBoth} // closes both popups
        onBack={handleBack} // closes only files popup
      />
    </>
  );
}
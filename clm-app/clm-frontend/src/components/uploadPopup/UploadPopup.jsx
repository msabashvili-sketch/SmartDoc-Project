import React, { useState } from "react";
import { useTranslation } from "react-i18next"; 
import "./UploadPopup.css";
import UploadFilesPopup from "./UploadFilesPopup";

export default function UploadPopup({ isOpen, onClose, handleUpload }) {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState(null); // smart or import
  const [isFilesPopupOpen, setIsFilesPopupOpen] = useState(false);

  if (!isOpen) return null;

  // Cancel main popup and reset selected option
  const handleMainCancel = () => {
    setSelectedOption(null); 
    onClose(); 
  };

  // Cancel both popups
  const handleCancelBoth = () => {
    setSelectedOption(null); 
    setIsFilesPopupOpen(false);
    onClose(); 
  };

  // Close only files popup
  const handleBack = () => {
    setIsFilesPopupOpen(false);
  };

  return (
    <>
      {!isFilesPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-window">
            <h2 className="popup-title">{t("uploadpopup.upload_documents")}</h2>

            {/* Smart Import option */}
            <div
              className={`upload-option large ${selectedOption === "smart" ? "active" : ""}`}
              onClick={() => setSelectedOption("smart")}
            >
              <div className="option-header">
                <div className="toggle-circle"></div>
                <span>{t("uploadpopup.smart_import")}</span>
              </div>

              <p className="option-description">
                {t("uploadpopup.smart_import_description")}
              </p>

              {/* Custom Banner replaces logo upload */}
              <div className="logo-upload">
                <img
                  src="/assets/upload-popup-banner2.jpg"
                  alt="Smart Import Banner"
                  className="banner-image"
                />
              </div>
            </div>

            {/* Import option */}
            <div
              className={`upload-option small ${selectedOption === "import" ? "active" : ""}`}
              onClick={() => setSelectedOption("import")}
            >
              <div className="option-header">
                <div className="toggle-circle"></div>
                <span>{t("uploadpopup.import")}</span>
              </div>

              <p className="option-description-2">
                {t("uploadpopup.import_description")}
              </p>
            </div>

            {/* Footer buttons */}
            <div className="popup-footer">
              <button className="cancel-btn" onClick={handleMainCancel}>
                {t("uploadpopup.cancel")}
              </button>

              <button
                className={`select-btn ${!selectedOption ? "disabled" : ""}`}
                onClick={() => setIsFilesPopupOpen(true)}
                disabled={!selectedOption}
              >
                {t("uploadpopup.select_files")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UploadFilesPopup */}
      <UploadFilesPopup
        isOpen={isFilesPopupOpen}
        onCancel={handleCancelBoth} 
        onBack={handleBack} 
        isSmartImport={selectedOption === "smart"} // <-- pass flag to popup
      />
    </>
  );
}
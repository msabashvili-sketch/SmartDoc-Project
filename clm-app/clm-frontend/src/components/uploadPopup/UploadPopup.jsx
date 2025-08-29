import React, { useState } from "react";
import { useTranslation } from "react-i18next"; 
import "./UploadPopup.css";
import UploadFilesPopup from "./UploadFilesPopup";

export default function UploadPopup({ isOpen, onClose, handleUpload, uploadedImage }) {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState(null);
  const [isFilesPopupOpen, setIsFilesPopupOpen] = useState(false);

  if (!isOpen) return null;

  // Cancel main popup and reset selected option
  const handleMainCancel = () => {
    setSelectedOption(null); // reset selected option
    onClose(); // close main popup
  };

  // Cancel both popups
  const handleCancelBoth = () => {
    setSelectedOption(null); // reset selected option
    setIsFilesPopupOpen(false);
    onClose(); // close main popup
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

              <div className="logo-upload" onClick={handleUpload}>
                {uploadedImage ? (
                  <img
                    src={uploadedImage}
                    alt={t("uploadpopup.brand_logo_preview")}
                    className="logo-preview"
                  />
                ) : (
                  <div className="logo-placeholder">
                    {t("uploadpopup.click_upload_brand_logo")}
                  </div>
                )}
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
        onCancel={handleCancelBoth} // closes both popups
        onBack={handleBack} // closes only files popup
      />
    </>
  );
}
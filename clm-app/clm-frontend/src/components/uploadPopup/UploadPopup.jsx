import React, { useState } from "react";
import { useTranslation } from "react-i18next"; // <-- import useTranslation
import "./UploadPopup.css";
import UploadFilesPopup from "./UploadFilesPopup";

export default function UploadPopup({ isOpen, onClose, handleUpload, uploadedImage }) {
  const { t } = useTranslation(); // <-- initialize translation
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
            <h2 className="popup-title">{t("uploadpopup.upload_documents")}</h2>

            {/* Smart Import option */}
            <div
              className={`upload-option large ${
                selectedOption === "smart" ? "active" : ""
              }`}
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
              className={`upload-option small ${
                selectedOption === "import" ? "active" : ""
              }`}
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

            <div className="popup-footer">
              <button className="cancel-btn" onClick={onClose}>
                {t("uploadpopup.cancel")}
              </button>
              <button
                className="select-btn"
                onClick={() => setIsFilesPopupOpen(true)}
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
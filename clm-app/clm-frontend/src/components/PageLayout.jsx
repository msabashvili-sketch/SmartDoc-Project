import React, { useState } from "react";
import DashboardHeader from "./DashboardHeader";
import "./PageLayout.css";
import { useTranslation } from "react-i18next";
import SendModal from "./SendModal";

export default function PageLayout({
  title,
  showUploadButton = false,
  showBanner = false,
  bannerImage = null,
  onUploadClick = () => {},
  onFilterClick = () => {},
  onColumnsClick = () => {},
  onSendClick = () => {},
  onExportClick = () => {},
  children,
  selectedDocuments = [],
  isFilterOpen = false,
}) {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

  const handleSendClick = () => {
    if (onSendClick) onSendClick();
    setIsSendModalOpen(true);
  };

  return (
    <>
      <DashboardHeader />

      <div className="page-layout">
        {/* Top space */}
        <div className="top-space">
          <h1 className="top-space-title">{title}</h1>
          {showUploadButton && (
            <label className="upload-button" onClick={onUploadClick}>
              <img
                src="/assets/upload-button-icon.png"
                alt="Upload Icon"
                className="upload-button-icon"
              />
              <span style={{ marginLeft: "6px" }}>
                {t("repositorypage.upload document")}
              </span>
            </label>
          )}
        </div>

        {/* Optional Banner */}
        {showBanner && bannerImage && (
          <div
            className="page-banner"
            style={{ backgroundImage: `url(${bannerImage})` }}
          >
            <div className="banner-text">
              <h3>{title}</h3>
              <p>{t("repositorypage.upload your documents here")}</p>
            </div>
          </div>
        )}

        {/* Wrapper for search + table */}
        <div className={`content-wrapper ${isFilterOpen ? "filter-open" : ""}`}>
          {/* Search bar */}
          <div className={`search-bar-wrapper ${isFilterOpen ? "filter-open" : ""}`}>
            <div className="search-filter-bar">
              <button className="filter-button" onClick={onFilterClick}>
                <img
                  src="/assets/filter-icon.png"
                  alt="Filter"
                  className="button-icon"
                />
              </button>

              <input
                type="text"
                className="search-bar"
                placeholder={t("repositorypage.search documents...")}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />

              <div className="search-buttons">
                <button className="columns-button" onClick={onColumnsClick}>
                  <img
                    src="/assets/column-icon.png"
                    alt="Columns"
                    className="button-icon"
                  />
                  {t("repositorypage.columns")}
                </button>
                <button className="send-button" onClick={handleSendClick}>
                  <img
                    src="/assets/email-icon.png"
                    alt="Send"
                    className="button-icon"
                  />
                  {t("repositorypage.send")}
                </button>
                <button className="export-button" onClick={onExportClick}>
                  <img
                    src="/assets/export-icon.png"
                    alt="Export"
                    className="button-icon"
                  />
                  {t("repositorypage.export")}
                </button>
              </div>
            </div>
          </div>

          {/* Table / children content */}
          <div className="table-content">{children}</div>
        </div>
      </div>

      {/* Send Modal */}
      {isSendModalOpen && (
        <SendModal
          isOpen={isSendModalOpen}
          onClose={() => setIsSendModalOpen(false)}
          selectedDocuments={selectedDocuments}
        />
      )}
    </>
  );
}
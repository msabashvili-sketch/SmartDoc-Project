import React, { useState } from "react";
import DashboardHeader from "./DashboardHeader";
import "./PageLayout.css";
import { useTranslation } from "react-i18next";

export default function PageLayout({
  title,
  showUploadButton = false,
  showBanner = false,
  bannerImage = null,
  onUploadClick = () => {},
  onFilterClick = () => {},
  onColumnsClick = () => {},
  onSendClick = () => {},
  onExportClick = () => {},   // new handler for export
  children,
}) {
  const { t } = useTranslation();
  const [searchText, setSearchText] = useState("");

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

        {/* Search + Filter + Columns + Send + Export Area */}
        <div className="search-filter-bar-wrapper">
          <div className="search-filter-bar">
            {/* Filter button on the left */}
            <button className="filter-button" onClick={onFilterClick}>
              <img
                src="/assets/filter-icon.png"
                alt="Filter"
                className="button-icon"
              />
            </button>

            {/* Search bar */}
            <input
              type="text"
              className="search-bar"
              placeholder={t("repositorypage.search documents...")}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />

            {/* Columns + Send + Export buttons on the right */}
            <div className="search-buttons">
              <button className="columns-button" onClick={onColumnsClick}>
                <img
                  src="/assets/column-icon.png"
                  alt="Columns"
                  className="button-icon"
                />
                {t("repositorypage.columns")}
              </button>
              <button className="send-button" onClick={onSendClick}>
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

        {/* Main Content */}
        <div className="page-content">{children}</div>
      </div>
    </>
  );
}
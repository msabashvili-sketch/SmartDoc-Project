import React, { useRef } from "react";
import DashboardHeader from "./DashboardHeader";
import "./PageLayout.css";
import { useTranslation } from "react-i18next";
import SendModal from "./SendModal";
import ColumnsPopup from "./ColumnsPopup";

// ✅ new imports
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function PageLayout({
  title,
  showUploadButton = false,
  showBanner = false,
  bannerImage = null,
  onUploadClick = () => {},
  onFilterClick = () => {},
  onSendClick = () => {},
  onExportClick, // keep existing prop
  children,
  selectedDocuments = [],
  isFilterOpen = false,
  columns = [],
  visibleColumns = [],
  onToggleColumn = () => {},
  offsetX = 0,
  offsetY = 4,
  searchText = "",
  onSearchChange = () => {},
}) {
  const { t } = useTranslation();

  // Send modal
  const [isSendModalOpen, setIsSendModalOpen] = React.useState(false);
  const handleSendClick = () => {
    if (onSendClick) onSendClick();
    setIsSendModalOpen(true);
  };

  // Columns popup
  const [isColumnsPopupOpen, setIsColumnsPopupOpen] = React.useState(false);
  const columnsButtonRef = useRef(null);

  // ✅ handle Excel export
  const handleExportClick = () => {
    try {
      // Extract table data (children contains table element)
      const table = document.querySelector(".table-content table");
      if (!table) {
        console.warn("No table found for export");
        return;
      }

      const workbook = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/octet-stream",
      });
      saveAs(blob, "documents.xlsx");
    } catch (error) {
      console.error("Export failed:", error);
    }

    if (onExportClick) onExportClick(); // keep existing behavior
  };

  return (
    <>
      <DashboardHeader />

      <div className="page-layout">
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

        <div className={`content-wrapper ${isFilterOpen ? "filter-open" : ""}`}>
          {/* Search bar */}
          <div
            className={`search-bar-wrapper ${isFilterOpen ? "filter-open" : ""}`}
          >
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
                onChange={(e) => onSearchChange(e.target.value)}
              />

              <div className="search-buttons">
                <button
                  className="columns-button"
                  onClick={() => setIsColumnsPopupOpen((prev) => !prev)}
                  ref={columnsButtonRef}
                >
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

                <button className="export-button" onClick={handleExportClick}>
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

          <div className="table-content">{children}</div>
        </div>
      </div>

      <ColumnsPopup
        isOpen={isColumnsPopupOpen}
        onClose={() => setIsColumnsPopupOpen(false)}
        columns={columns}
        visibleColumns={visibleColumns}
        onToggleColumn={onToggleColumn}
        anchorRef={columnsButtonRef}
        offsetX={offsetX}
        offsetY={offsetY}
      />

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
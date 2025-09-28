import React, { useRef } from "react";
import DashboardHeader from "./DashboardHeader";
import "./PageLayout.css";
import { useTranslation } from "react-i18next";
import SendModal from "./SendModal";
import ColumnsPopup from "./ColumnsPopup";
import * as XLSX from "xlsx";

export default function PageLayout({
  title,
  showUploadButton = false,
  showBanner = false,
  bannerImage = null,
  bannerContent = null,
  bannerHeight = "200px",
  onUploadClick = () => {},
  onFilterClick = () => {},   // ✅ keep filter button handler
  onSendClick = () => {},
  onExportClick,
  children,
  selectedDocuments = [],
  columns = [],
  visibleColumns = [],
  onToggleColumn = () => {},
  offsetX = 0,
  offsetY = 4,
  searchText = "",
  onSearchChange = () => {},
}) {
  const { t } = useTranslation();

  const [isSendModalOpen, setIsSendModalOpen] = React.useState(false);
  const handleSendClick = () => {
    if (onSendClick) onSendClick();
    setIsSendModalOpen(true);
  };

  const [isColumnsPopupOpen, setIsColumnsPopupOpen] = React.useState(false);
  const columnsButtonRef = useRef(null);

  const handleExportClick = async () => {
    try {
      const table = document.querySelector(".table-content table");
      if (!table) return;

      const workbook = XLSX.utils.table_to_book(table, { sheet: "Sheet1" });
      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const date = new Date();
      const formattedDate = date.toISOString().split("T")[0];
      const safeTitle = title.replace(/\s+/g, "_");
      const suggestedName = `${safeTitle}_${formattedDate}.xlsx`;

      if (window.showSaveFilePicker) {
        const options = {
          types: [
            {
              description: "Excel Files",
              accept: {
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
              },
            },
          ],
          suggestedName,
        };
        const handle = await window.showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = suggestedName;
        a.click();
        URL.revokeObjectURL(url);
      }

      if (onExportClick) onExportClick();
    } catch (err) {
      console.error("Export failed:", err);
    }
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

        {/* Banner section */}
        {showBanner && (
          <div
            className="page-banner"
            style={{
              backgroundImage: bannerImage ? `url(${bannerImage})` : "none",
              height: bannerHeight,
            }}
          >
            {bannerContent && <>{bannerContent}</>}
          </div>
        )}

        <div className="content-wrapper">
          {/* Search bar */}
          <div className="search-bar-wrapper">
            <div className="search-filter-bar">
              {/* ✅ filter button still here */}
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
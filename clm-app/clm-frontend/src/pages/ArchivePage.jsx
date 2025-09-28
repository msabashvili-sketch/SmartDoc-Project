import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import RepositoryDetailsPanel from "../components/RepositoryDetailsPanel";
import FilterPanel from "../components/FilterPanel"; // ✅ import filter panel
import { useTranslation } from "react-i18next";
import "./ArchivePage.css";

export default function ArchivePage() {
  const { t } = useTranslation();

  // Files and pagination
  const [files, setFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Selected rows
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [highlightedRowId, setHighlightedRowId] = useState(null);

  // Filter panel
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Columns and toggling
  const columns = [
    { key: "documentTitle", label: t("archivepage.document title") },
    { key: "folder", label: t("archivepage.folder") },
    { key: "counterparty", label: t("archivepage.counterparty") },
    { key: "documentType", label: t("archivepage.document type") },
    { key: "agreementDate", label: t("archivepage.agreement date") },
    { key: "expiryDate", label: t("archivepage.expiry date") },
    { key: "signatureName", label: t("archivepage.signature name") },
  ];
  const [visibleColumns, setVisibleColumns] = useState(columns.map(c => c.key));

  // Search
  const [searchText, setSearchText] = useState("");

  // Fetch archived files
  useEffect(() => {
    fetch("http://localhost:4000/api/documents/archive")
      .then(res => res.json())
      .then(data => {
        setFiles((data.files || []).map(f => ({
          ...f,
          _id: f._id.toString(),
          folderName: f.metadata?.folderName || ""
        })));
      })
      .catch(err => console.error("Error fetching archived files:", err));
  }, []);

  // Toggle column visibility
  const handleToggleColumn = (key) => {
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  // Filter files based on search
  const filteredFiles = files.filter(file =>
    columns.some(col => {
      const value = col.key === "documentTitle" ? file.filename
                    : col.key === "folder" ? file.folderName
                    : file.metadata?.[col.key];
      return value?.toString().toLowerCase().includes(searchText.toLowerCase());
    })
  );

  // Pagination
  const totalRows = filteredFiles.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const filesOnPage = filteredFiles.slice(startIndex, endIndex);
  const emptyRows = rowsPerPage - filesOnPage.length;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const handleRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Row selection
  const toggleRow = (id) => {
    setSelectedFiles(prev =>
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const areAllSelected = filesOnPage.length > 0 && filesOnPage.every(f => selectedFiles.includes(f._id));
  const toggleSelectAll = () => {
    if (areAllSelected) setSelectedFiles([]);
    else setSelectedFiles([...new Set([...selectedFiles, ...filesOnPage.map(f => f._id)])]);
  };

  // Filter panel apply handler
  const handleApplyFilters = () => {
    // TODO: implement filter logic here if needed
    setIsFilterOpen(false);
  };

  return (
    <>
      {/* ⚡ PageLayout */}
      <PageLayout
        title={t("archivepage.archive")}
        columns={columns}
        visibleColumns={visibleColumns}
        onToggleColumn={handleToggleColumn}
        searchText={searchText}
        onSearchChange={setSearchText}
        showBanner={true}
        bannerImage="/assets/archive-page-banner.jpg"
        bannerHeight="120px"
        showFilterButton={true}
        onFilterClick={() => setIsFilterOpen(prev => !prev)}
      >
        {/* Archive Table */}
        <div className="archive-table-wrapper">
          <div className="archive-table-container">
            <table className="archive-table">
              <thead>
                <tr>
                  <th className="checkbox-col sticky">
                    <input
                      type="checkbox"
                      checked={areAllSelected}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  {columns
                    .filter(col => visibleColumns.includes(col.key))
                    .map((col, idx) => (
                      <th key={col.key} className={idx === 0 ? "sticky" : ""}>
                        {col.label}
                      </th>
                    ))}
                </tr>
              </thead>

              <tbody>
                {filesOnPage.map((file, idx) => {
                  const isSelected = selectedFiles.includes(file._id);
                  const isHighlighted = highlightedRowId === file._id;

                  return (
                    <tr
                      key={file._id || idx}
                      className={`${isSelected ? "selected-row" : ""} ${isHighlighted ? "highlighted-row" : ""}`}
                      onDoubleClick={() => {
                        setSelectedFile(file);
                        setIsDetailsOpen(true);
                        setHighlightedRowId(file._id);
                      }}
                    >
                      <td className="checkbox-col sticky">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(file._id)}
                        />
                      </td>

                      {columns
                        .filter(col => visibleColumns.includes(col.key))
                        .map((col, colIdx) => {
                          const isSticky = colIdx === 0;
                          return (
                            <td key={col.key} className={isSticky ? "sticky" : ""}>
                              {col.key === "documentTitle" ? (
                                <div className="doc-cell">
                                  <img
                                    src="/assets/document-icon.png"
                                    alt="doc"
                                    className="doc-icon"
                                  />
                                  <span>{file.filename}</span>
                                </div>
                              ) : col.key === "folder" ? (
                                file.folderName
                              ) : (
                                file.metadata?.[col.key] || ""
                              )}
                            </td>
                          );
                        })}
                    </tr>
                  );
                })}

                {Array.from({ length: emptyRows }).map((_, rowIndex) => (
                  <tr key={`empty-${rowIndex}`}>
                    <td className="checkbox-col">&nbsp;</td>
                    {columns
                      .filter(col => visibleColumns.includes(col.key))
                      .map(col => <td key={col.key}>&nbsp;</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="archive-footer">
            <div className="footer-left">
              {totalRows}{" "}
              {totalRows === 1
                ? t("archivepage.file_singular")
                : t("archivepage.files already uploaded")}
            </div>

            <div className="footer-right">
              <label>
                {t("archivepage.rows per page")}:
                <select value={rowsPerPage} onChange={handleRowsPerPageChange}>
                  {[25, 50, 100].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>

              <div className="pagination-buttons">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  {"<"}
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    className={currentPage === i + 1 ? "active" : ""}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  {">"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RepositoryDetailsPanel */}
        {selectedFile && (
          <RepositoryDetailsPanel
            isOpen={isDetailsOpen}
            file={selectedFile}
            onClose={() => {
              setIsDetailsOpen(false);
              setHighlightedRowId(null);
            }}
            onDelete={(fileId) => {
              setFiles(prev => prev.filter(f => f._id !== fileId));
              setIsDetailsOpen(false);
              setHighlightedRowId(null);
            }}
            showSendButton={false}
            footerButtonClass="small-btn"
          />
        )}
      </PageLayout>

      {/* ⚡ Filter Panel OUTSIDE PageLayout */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
      />
    </>
  );
}
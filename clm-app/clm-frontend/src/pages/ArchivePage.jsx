import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import RepositoryDetailsPanel from "../components/RepositoryDetailsPanel"; // import details panel
import { useTranslation } from "react-i18next";
import "./ArchivePage.css";

export default function ArchivePage() {
  const { t } = useTranslation();

  const [files, setFiles] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null); // for details panel
  const [isDetailsOpen, setIsDetailsOpen] = useState(false); // panel open state

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const columns = [
    { key: "documentTitle", label: t("archivepage.document title") },
    { key: "folder", label: t("archivepage.folder") },
    { key: "counterparty", label: t("archivepage.counterparty") },
    { key: "documentType", label: t("archivepage.document type") },
    { key: "agreementDate", label: t("archivepage.agreement date") },
    { key: "expiryDate", label: t("archivepage.expiry date") },
    { key: "signatureName", label: t("archivepage.signature name") },
  ];

  // Initialize visible columns
  useEffect(() => {
    setVisibleColumns(columns.map(c => c.key));
  }, [t]);

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

  const handleToggleColumn = (key) => {
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  // Pagination
  const totalRows = files.length;
  const totalPages = Math.ceil(totalRows / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const filesOnPage = files.slice(startIndex, endIndex);
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

  const toggleSelectAll = () => {
    if (areAllSelected) {
      setSelectedFiles([]);
    } else {
      const pageIds = filesOnPage.map(f => f._id);
      setSelectedFiles([...new Set([...selectedFiles, ...pageIds])]);
    }
  };

  const areAllSelected = filesOnPage.length > 0 && filesOnPage.every(f => selectedFiles.includes(f._id));

  return (
    <PageLayout
      title={t("archivepage.archive")}
      columns={columns}
      visibleColumns={visibleColumns}
      onToggleColumn={handleToggleColumn}
    >
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
                return (
                  <tr
                    key={file._id || idx}
                    className={isSelected ? "selected-row" : ""}
                    onDoubleClick={() => {
                      setSelectedFile(file);
                      setIsDetailsOpen(true); // open panel
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
          onClose={() => setIsDetailsOpen(false)}
          onDelete={(fileId) => {
            setFiles(prev => prev.filter(f => f._id !== fileId));
            setIsDetailsOpen(false);
          }}
          onArchive={(fileId) => {
            setFiles(prev => prev.filter(f => f._id !== fileId));
            setIsDetailsOpen(false);
          }}
        />
      )}
    </PageLayout>
  );
}
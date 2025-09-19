import React, { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout";
import { useTranslation } from "react-i18next";
import "./ArchivePage.css";

export default function ArchivePage() {
  const { t } = useTranslation();

  const [files, setFiles] = useState([]);
  const [visibleColumns] = useState([
    "documentTitle",
    "folder",
    "counterparty",
    "documentType",
    "agreementDate",
    "expiryDate",
    "signatureName",
  ]);

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

  // Fetch archived files on mount
  useEffect(() => {
    fetch("http://localhost:4000/api/documents/archive")
      .then((res) => res.json())
      .then((data) => setFiles(data.files || []))
      .catch((err) => console.error("Error fetching archived files:", err));
  }, []);

  // Pagination calculations
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

  return (
    <PageLayout title={t("archivepage.archive")}>
      <div className="archive-table-wrapper">
        <div className="archive-table-container">
          <table className="archive-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input type="checkbox" />
                </th>
                {columns
                  .filter((col) => visibleColumns.includes(col.key))
                  .map((col) => (
                    <th key={col.key}>{col.label}</th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {filesOnPage.map((file, idx) => (
                <tr key={file._id || idx}>
                  <td className="checkbox-col">
                    <input type="checkbox" />
                  </td>
                  {columns
                    .filter((col) => visibleColumns.includes(col.key))
                    .map((col) => (
                      <td key={col.key}>
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
                          file.metadata?.folderName || ""
                        ) : (
                          file.metadata?.[col.key] || ""
                        )}
                      </td>
                    ))}
                </tr>
              ))}

              {Array.from({ length: emptyRows }).map((_, rowIndex) => (
                <tr key={`empty-${rowIndex}`}>
                  <td className="checkbox-col">&nbsp;</td>
                  {columns.map((col) => (
                    <td key={col.key}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
                {[25, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
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
    </PageLayout>
  );
}
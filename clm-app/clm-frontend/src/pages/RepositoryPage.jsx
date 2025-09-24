import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import FilterPanel from "../components/FilterPanel";
import RepositoryDetailsPanel from "../components/RepositoryDetailsPanel";
import UploadPopup from "../components/uploadPopup/UploadPopup";
import SendModal from "../components/SendModal";
import "./RepositoryPage.css";
import { useTranslation } from "react-i18next";

// Tooltip cell component with icon support
const TooltipCell = ({ text, className }) => (
  <td className={className}>
    <div className="cell-content">
      {text && <img src="/assets/document-icon.png" alt="" className="cell-icon" />}
      <div className="cell-text">{text}</div>
      <span className="cell-tooltip">{text}</span>
    </div>
  </td>
);

export default function RepositoryPage() {
  const [files, setFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { t } = useTranslation();

  // Fetch files from backend
  const fetchFiles = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/documents/repository?_=${Date.now()}`);
      const data = await res.json();
      setFiles((data.files || []).map(file => ({
        ...file,
        _id: file._id.toString(),
        folderName: file.metadata?.folderName || ""
      })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchFiles(); }, []);

  // Columns definition
  const columns = [
    { key: "filename", label: t("repositorypage.document title") },
    { key: "folderName", label: t("repositorypage.folder") },
    { key: "counterparty", label: t("repositorypage.counterparty") },
    { key: "documentType", label: t("repositorypage.document type") },
    { key: "agreementDate", label: t("repositorypage.agreement date") },
    { key: "expiryDate", label: t("repositorypage.expiry date") },
    { key: "signatureName", label: t("repositorypage.signature name") },
  ];

  const [visibleColumns, setVisibleColumns] = useState(columns.map(col => col.key));

  const handleToggleColumn = (key) => {
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    );
  };

  // Filter files
  const filteredFiles = files.filter(file => {
    if (!searchText) return true;
    const lowerSearch = searchText.toLowerCase();
    return columns.some(col => {
      const value = file[col.key] || file.metadata?.[col.key] || "";
      return value.toString().toLowerCase().includes(lowerSearch);
    });
  });

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / rowsPerPage));
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredFiles.slice(indexOfFirstRow, indexOfLastRow);

  const goToPage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  const handleApplyFilters = () => setIsFilterOpen(false);
  const handleRowClick = (file) => {
    setSelectedFile(file);
    setIsDetailsOpen(true);
  };
  const handleDeleteDocument = async (docId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/documents/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: [docId] }),
      });
      if (!res.ok) throw new Error("Failed to delete document");

      setFiles(prev => {
        const updated = prev.filter(file => file._id !== docId);
        const pages = Math.ceil(updated.length / rowsPerPage) || 1;
        if (currentPage > pages) setCurrentPage(pages);
        return updated;
      });

      setIsDetailsOpen(false);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert(t("detailspanel.deleteError"));
    }
  };

  const toggleRowSelection = (fileId) => {
    setSelectedRows(prev =>
      prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === currentRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(currentRows.map(file => file._id));
    }
  };

  const selectedDocs = files.filter(file => selectedRows.includes(file._id));

  return (
    <PageLayout
      title={t("repositorypage.repository")}
      showUploadButton
      showBanner={false}
      onUploadClick={() => setIsPopupOpen(true)}
      onFilterClick={() => setIsFilterOpen(prev => !prev)}
      isFilterOpen={isFilterOpen}
      columns={columns}
      visibleColumns={visibleColumns}
      onToggleColumn={handleToggleColumn}
      searchText={searchText}
      onSearchChange={setSearchText}
    >
      <div className="repository-page-wrapper">
        <div className={`repository-content ${isFilterOpen ? "filter-open" : ""}`}>
          <FilterPanel
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            onApply={handleApplyFilters}
          />

          <div className="content-wrapper">
            <div className="table-wrapper">
              <div className="table-scroll-wrapper">
                <table className="repository-table">
                  <thead>
                    <tr>
                      <th className="sticky-col checkbox-col">
                        <input
                          type="checkbox"
                          onChange={toggleSelectAll}
                          checked={selectedRows.length === currentRows.length && currentRows.length > 0}
                        />
                      </th>
                      {columns.map(col =>
                        visibleColumns.includes(col.key) ? (
                          <th key={col.key} className={col.key === "filename" ? "sticky-col title-col" : ""}>
                            {col.label}
                          </th>
                        ) : null
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map(file => (
                      <tr
                        key={file._id}
                        onDoubleClick={() => handleRowClick(file)}
                        className={selectedRows.includes(file._id) ? "selected" : ""}
                      >
                        <td className="sticky-col checkbox-col" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(file._id)}
                            onChange={() => toggleRowSelection(file._id)}
                          />
                        </td>
                        {columns.map(col =>
                          visibleColumns.includes(col.key) ? (
                            <TooltipCell
                              key={col.key}
                              className={col.key === "filename" ? "sticky-col title-col" : ""}
                              text={file[col.key] || file.metadata?.[col.key]}
                            />
                          ) : null
                        )}
                      </tr>
                    ))}

                    {currentRows.length < rowsPerPage &&
                      Array.from({ length: rowsPerPage - currentRows.length }).map((_, i) => (
                        <tr key={`empty-${i}`}>
                          <td className="sticky-col checkbox-col">&nbsp;</td>
                          {columns.map(col =>
                            visibleColumns.includes(col.key) ? <td key={col.key}>&nbsp;</td> : null
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="repository-footer">
          <div className="footer-left">
            {files.length} {files.length === 1 ? t("repositorypage.file_singular") : t("repositorypage.files already uploaded")}
          </div>

          <div className="footer-right">
            <label>
              {t("repositorypage.rows per page")}:
              <select value={rowsPerPage} onChange={e => setRowsPerPage(Number(e.target.value))}>
                {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>

            <div className="pagination-buttons">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>{"<"}</button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} className={currentPage === i + 1 ? "active" : ""} onClick={() => goToPage(i + 1)}>{i + 1}</button>
              ))}
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>{">"}</button>
            </div>
          </div>
        </div>
      </div>

      <UploadPopup
        isOpen={isPopupOpen}
        onClose={() => { setIsPopupOpen(false); fetchFiles(); }}
      />

      <RepositoryDetailsPanel
        isOpen={isDetailsOpen}
        file={selectedFile}
        onClose={() => setIsDetailsOpen(false)}
        onDelete={handleDeleteDocument}
        onArchive={archivedFileId => {
          setFiles(prev => prev.filter(file => file._id !== archivedFileId));
          setIsDetailsOpen(false);
          setSelectedFile(null);
        }}
      />

      <button
        className="send-btn"
        onClick={() => {
          if (selectedDocs.length === 0) {
            alert("Please select at least one file to send");
            return;
          }
          setIsSendModalOpen(true);
        }}
      >
        Send
      </button>

      {isSendModalOpen && (
        <SendModal selectedDocs={selectedDocs} onClose={() => setIsSendModalOpen(false)} />
      )}
    </PageLayout>
  );
}
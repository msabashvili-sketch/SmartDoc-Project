// src/pages/RepositoryPage.jsx
import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import RepositoryDetailsPanel from "../components/RepositoryDetailsPanel";
import UploadPopup from "../components/uploadPopup/UploadPopup";
import SendModal from "../components/SendModal";
import FilterPanel from "../components/FilterPanel";
import TextViewer from "../components/TextViewer";
import "./RepositoryPage.css";
import { useTranslation } from "react-i18next";

export default function RepositoryPage() {
  const { t } = useTranslation();

  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [viewerFile, setViewerFile] = useState(null); // ✅ new text viewer state

  // ---- Fetch repository files ----
  const fetchFiles = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/documents/repository?_=${Date.now()}`);
      const data = await res.json();

      const filesData = (data.files || []).map((file, idx) => {
        let date = "", time = "";
        if (file.createdAt) {
          const dt = file.createdAt._seconds ? new Date(file.createdAt._seconds * 1000) : new Date(file.createdAt);
          date = dt.toLocaleDateString();
          time = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }

        return {
          id: file._id || file.id || `file-${idx}`,
          filename: file.originalName || file.filename || "(Untitled)",
          metadata: file.metadata || {},
          folderName: file.folderName || "",
          documentType: file.documentType || "",
          counterparty: file.counterparty || "",
          expiryDate: file.expiryDate || "",
          agreementDate: file.agreementDate || "",
          signatureName: file.signatureName || "",
          autoRenew: file.autoRenew || "",
          breachNotification: file.breachNotification || "",
          archived: file.archived || false,
          repository: file.repository || false,
          date,
          time,
          __raw: file,
        };
      });

      setFiles(filesData);
      setFilteredFiles(filesData);
    } catch (err) {
      console.error("Error fetching repository files:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const columns = [
    { key: "filename", label: t("repositorypage.document title") },
    { key: "folderName", label: t("repositorypage.folder") },
    { key: "date", label: t("repositorypage.upload date") },
    { key: "autoRenew", label: t("repositorypage.auto renew if not terminated") },
    { key: "breachNotification", label: t("repositorypage.contract breach notification") },
    { key: "counterparty", label: t("repositorypage.counterparty") },
    { key: "documentType", label: t("repositorypage.document type") },
    { key: "agreementDate", label: t("repositorypage.agreement date") },
    { key: "expiryDate", label: t("repositorypage.expiry date") },
    { key: "signatureName", label: t("repositorypage.signature name") },
  ];

  const [visibleColumns, setVisibleColumns] = useState(columns.map((c) => c.key));
  const handleToggleColumn = (key) => {
    setVisibleColumns((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  // Filters
  const handleApplyFilters = (filters) => {
    let filtered = [...files];
    if (filters.folder)
      filtered = filtered.filter((f) => f.folderName?.toLowerCase().includes(filters.folder.toLowerCase()));
    if (filters.documentType)
      filtered = filtered.filter((f) => f.documentType?.toLowerCase().includes(filters.documentType.toLowerCase()));
    if (filters.counterparty)
      filtered = filtered.filter((f) => f.counterparty?.toLowerCase().includes(filters.counterparty.toLowerCase()));
    setFilteredFiles(filtered);
  };

  // Search
  const searchFilteredFiles = filteredFiles.filter((file) => {
    if (!searchText) return true;
    const lower = searchText.toLowerCase();
    return columns.some((col) => {
      const value = file[col.key] || "";
      return value.toString().toLowerCase().includes(lower);
    });
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(searchFilteredFiles.length / rowsPerPage));
  const indexOfLastRow = currentPage * rowsPerPage;
  const currentRows = searchFilteredFiles.slice(indexOfLastRow - rowsPerPage, indexOfLastRow);

  // Handlers
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

      setFiles((prev) => prev.filter((f) => f.id !== docId));
      setFilteredFiles((prev) => prev.filter((f) => f.id !== docId));
      setIsDetailsOpen(false);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      alert(t("detailspanel.deleteError"));
    }
  };

  const toggleRowSelection = (fileId) => {
    setSelectedRows((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === currentRows.length) setSelectedRows([]);
    else setSelectedRows(currentRows.map((file) => file.id));
  };

  const selectedDocs = files.filter((file) => selectedRows.includes(file.id));

  // --- Text Viewer handlers ---
  const openTextViewer = (file) => {
    setViewerFile(file);
    setIsDetailsOpen(false); // slide panel back
  };

  const closeTextViewer = () => setViewerFile(null);

  return (
    <PageLayout
      title={t("repositorypage.repository")}
      showUploadButton
      showBanner
      bannerImage="/assets/repository-page-banner.jpg"
      bannerHeight="120px"
      bannerBelowSearch
      onUploadClick={() => setIsPopupOpen(true)}
      onFilterClick={() => setIsFilterOpen(true)}
      columns={columns}
      visibleColumns={visibleColumns}
      onToggleColumn={handleToggleColumn}
      searchText={searchText}
      onSearchChange={setSearchText}
    >
      <div className="repository-page-wrapper">
        {/* Table */}
        <div className="repository-content">
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
                    {columns.map(
                      (col) =>
                        visibleColumns.includes(col.key) && (
                          <th key={col.key} className={col.key === "filename" ? "sticky-col title-col" : ""}>
                            {col.label}
                          </th>
                        )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {currentRows.map((file) => (
                    <tr
                      key={file.id}
                      onDoubleClick={() => handleRowClick(file)}
                      className={selectedRows.includes(file.id) ? "selected" : ""}
                    >
                      <td className="sticky-col checkbox-col" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(file.id)}
                          onChange={() => toggleRowSelection(file.id)}
                        />
                      </td>
                      {columns.map(
                        (col) =>
                          visibleColumns.includes(col.key) && (
                            <td
                              key={col.key}
                              className={col.key === "filename" ? "sticky-col title-col" : col.key === "date" ? "td-uploaded" : ""}
                            >
                              {col.key === "date" ? (
                                <>
                                  <div className="date">{file.date}</div>
                                  <div className="time">{file.time}</div>
                                </>
                              ) : (
                                file[col.key]
                              )}
                            </td>
                          )
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="header-bottom-shadow"></div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="repository-footer">
          <div className="footer-left">
            {files.length} {files.length === 1 ? t("repositorypage.files already uploaded") : t("repositorypage.files already uploaded")}
          </div>

          <div className="footer-right">
            <label>
              {t("repositorypage.rows per page")}:
              <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                {[25, 50, 100].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>

            <div className="pagination-buttons">
              <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>{"<"}</button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button key={i} className={currentPage === i + 1 ? "active" : ""} onClick={() => setCurrentPage(i + 1)}>
                  {i + 1}
                </button>
              ))}
              <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>{">"}</button>
            </div>
          </div>
        </div>
      </div>

      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApply={handleApplyFilters} />

      <UploadPopup
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          fetchFiles(); // refresh list after upload
        }}
      />

      <RepositoryDetailsPanel
        isOpen={isDetailsOpen}
        file={selectedFile}
        onClose={() => setIsDetailsOpen(false)}
        onDelete={handleDeleteDocument}
        onArchive={(archivedFileId) => {
          setFiles((prev) => prev.filter((f) => f.id !== archivedFileId));
          setFilteredFiles((prev) => prev.filter((f) => f.id !== archivedFileId));
          setIsDetailsOpen(false);
          setSelectedFile(null);
        }}
        onOpenTextViewer={openTextViewer} // ✅ new prop
      />

      {viewerFile && (
        <TextViewer file={viewerFile} onClose={closeTextViewer} />
      )}

      {selectedDocs.length > 0 && (
        <button className="send-btn" onClick={() => setIsSendModalOpen(true)}>Send</button>
      )}

      {isSendModalOpen && <SendModal selectedRows={selectedRows} files={files} onClose={() => setIsSendModalOpen(false)} />}
    </PageLayout>
  );
}
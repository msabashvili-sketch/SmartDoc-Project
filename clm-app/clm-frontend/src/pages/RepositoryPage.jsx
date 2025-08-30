import React, { useEffect, useState } from "react";
import PageLayout from "../components/PageLayout";
import FilterPanel from "../components/FilterPanel";
import RepositoryDetailsPanel from "../components/RepositoryDetailsPanel";
import UploadPopup from "../components/uploadPopup/UploadPopup";
import "./RepositoryPage.css";
import { useTranslation } from "react-i18next";

export default function RepositoryPage() {
  const [files, setFiles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);

  const rowsPerPage = 25;
  const { t } = useTranslation();

  // Fetch repository files
  const fetchFiles = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/documents/repository?_=${Date.now()}`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // Pagination
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = files.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(files.length / rowsPerPage);

  const goToPage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setIsFilterOpen(false);
  };

  // Row click to open details
  const handleRowClick = (file) => {
    setSelectedFile(file);
    setIsDetailsOpen(true);
  };

  // Delete repository document
  const handleDeleteDocument = async (docId) => {
    try {
      const res = await fetch(`http://localhost:4000/api/documents/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: [docId] }),
      });

      if (!res.ok) throw new Error("Failed to delete document");

      setFiles((prev) => prev.filter((file) => file._id !== docId));
      setIsDetailsOpen(false);
      setSelectedFile(null);
    } catch (err) {
      console.error("Delete document error:", err);
      alert(t("detailspanel.deleteError"));
    }
  };

  // Handle checkbox changes
  const toggleRowSelection = (fileId) => {
    setSelectedRows((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === currentRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(currentRows.map((file) => file._id));
    }
  };

  return (
    <>
      <PageLayout
        title={t("repositorypage.repository")}
        showUploadButton={true}
        showBanner={false}
        onUploadClick={() => setIsPopupOpen(true)}
        onFilterClick={() => setIsFilterOpen(!isFilterOpen)}
      >
        {/* Main content */}
        <div className={`repository-content ${isFilterOpen ? "filter-open" : ""}`}>
          <FilterPanel isOpen={isFilterOpen} onApply={handleApplyFilters} />

          <div className="table-container">
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
                  <th className="sticky-col title-col">{t("repositorypage.document title")}</th>
                  <th>{t("repositorypage.folder")}</th>
                  <th>{t("repositorypage.counterparty")}</th>
                  <th>{t("repositorypage.document type")}</th>
                  <th>{t("repositorypage.agreement date")}</th>
                  <th>{t("repositorypage.expiry date")}</th>
                  <th>{t("repositorypage.signature name")}</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((file) => (
                  <tr key={file._id} onClick={() => handleRowClick(file)}>
                    <td className="sticky-col checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(file._id)}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRowSelection(file._id);
                        }}
                      />
                    </td>
                    <td className="sticky-col title-col">{file.filename}</td>
                    <td>{file.metadata?.folder}</td>
                    <td>{file.metadata?.counterparty}</td>
                    <td>{file.metadata?.documentType}</td>
                    <td>{file.metadata?.agreementDate}</td>
                    <td>{file.metadata?.expiryDate}</td>
                    <td>{file.metadata?.signatureName}</td>
                  </tr>
                ))}
                {currentRows.length < rowsPerPage &&
                  Array.from({ length: rowsPerPage - currentRows.length }).map((_, i) => (
                    <tr key={`empty-${i}`}>
                      <td className="sticky-col checkbox-col">&nbsp;</td>
                      <td className="sticky-col title-col">&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                      <td>&nbsp;</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>

        {/* Upload popup */}
        <UploadPopup
          isOpen={isPopupOpen}
          onClose={() => {
            setIsPopupOpen(false);
            fetchFiles();
          }}
        />

        {/* Repository Details Panel */}
        <RepositoryDetailsPanel
          isOpen={isDetailsOpen}
          file={selectedFile}
          onClose={() => setIsDetailsOpen(false)}
          onDelete={handleDeleteDocument}
        />
      </PageLayout>
    </>
  );
}
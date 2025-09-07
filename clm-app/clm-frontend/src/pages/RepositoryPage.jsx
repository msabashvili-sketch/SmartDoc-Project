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

  const { t } = useTranslation();

  const fetchFiles = async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/documents/repository?_=${Date.now()}`);
      const data = await res.json();
      setFiles((data.files || []).map(file => ({
        ...file,
        _id: file._id.toString(),
        folderName: file.metadata?.folderName || "" // <-- pull folder name from metadata
      })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  useEffect(() => {
    console.log("SelectedRows:", selectedRows);
    const selectedDocs = files.filter(file => selectedRows.includes(file._id));
    console.log("SelectedDocs for SendModal:", selectedDocs);
  }, [selectedRows, files]);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = files.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.max(1, Math.ceil(files.length / rowsPerPage));

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

      setFiles((prev) => {
        const updated = prev.filter((file) => file._id !== docId);
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

  // Compute selected documents for SendModal
  const selectedDocs = files.filter(file => selectedRows.includes(file._id));

  return (
    <>
      <PageLayout
        title={t("repositorypage.repository")}
        showUploadButton
        showBanner={false}
        onUploadClick={() => setIsPopupOpen(true)}
        onFilterClick={() => setIsFilterOpen((prev) => !prev)}
        isFilterOpen={isFilterOpen}
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
                            checked={
                              selectedRows.length === currentRows.length && currentRows.length > 0
                            }
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
                          <td className="sticky-col checkbox-col" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedRows.includes(file._id)}
                              onChange={() => toggleRowSelection(file._id)}
                            />
                          </td>
                          <TooltipCell className="sticky-col title-col" text={file.filename} />
                          <TooltipCell text={file.folderName} /> {/* <-- updated here */}
                          <TooltipCell text={file.metadata?.counterparty} />
                          <TooltipCell text={file.metadata?.documentType} />
                          <TooltipCell text={file.metadata?.agreementDate} />
                          <TooltipCell text={file.metadata?.expiryDate} />
                          <TooltipCell text={file.metadata?.signatureName} />
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
            </div>
          </div>

          <div className="repository-footer">
            <div className="pagination-controls">
              <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                Prev
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                Next
              </button>
            </div>
            <div className="rows-per-page">
              <label>
                Rows per page:
                <select value={rowsPerPage} onChange={(e) => setRowsPerPage(Number(e.target.value))}>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <UploadPopup
          isOpen={isPopupOpen}
          onClose={() => {
            setIsPopupOpen(false);
            fetchFiles();
          }}
        />

        <RepositoryDetailsPanel
          isOpen={isDetailsOpen}
          file={selectedFile}
          onClose={() => setIsDetailsOpen(false)}
          onDelete={handleDeleteDocument}
        />

        {/* Send button */}
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

        {/* Send Modal */}
        {isSendModalOpen && (
          <SendModal
            selectedDocs={selectedDocs}
            onClose={() => setIsSendModalOpen(false)}
          />
        )}
      </PageLayout>
    </>
  );
}
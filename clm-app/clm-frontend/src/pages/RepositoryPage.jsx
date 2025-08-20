import React, { useEffect, useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import FilterPanel from "../components/FilterPanel";
import UploadPopup from "../components/uploadPopup/UploadPopup";
import "./RepositoryPage.css";
import { useTranslation } from "react-i18next";

export default function RepositoryPage() {
  const [files, setFiles] = useState([]);
  const [bannerImage, setBannerImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const rowsPerPage = 25;
  const { t } = useTranslation();

  // Fetch banner
  useEffect(() => {
    setBannerImage("/images/banner-placeholder.jpg");
  }, []);

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

  // Pagination calculation
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = files.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(files.length / rowsPerPage);

  const goToPage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Apply filters handler (currently just closes panel)
  const handleApplyFilters = () => {
    console.log("Filters applied");
    setIsFilterOpen(false);
  };

  return (
    <>
      <DashboardHeader />
      <div className="repository-page">
        {/* Top space */}
        <div
          className="repository-top-space"
          style={{ backgroundColor: "#f0f0f0" }}
        >
          <h1 className="repository-title">{t("repositorypage.repository")}</h1>
          <label
            className="upload-button"
            onClick={() => setIsPopupOpen(true)}
          >
            {t("repositorypage.upload document")}
          </label>
        </div>

        {/* Search bar + Filter button */}
        <div className="search-filter-bar">
          <button
            className="filter-button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            {t("repositorypage.filters")}
          </button>
          <input
            type="text"
            className="search-bar"
            placeholder={t("repositorypage.search documents...")}
          />
        </div>

        {/* Main content */}
        <div className={`repository-content ${isFilterOpen ? "filter-open" : ""}`}>
          <FilterPanel isOpen={isFilterOpen} onApply={handleApplyFilters} />
          
          <div className="table-container">
            <table className="repository-table">
              <thead>
                <tr>
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
                  <tr key={file._id}>
                    <td className="sticky-col title-col">{file.filename}</td>
                    <td>{file.metadata?.folder}</td>
                    <td>{file.metadata?.counterparty}</td>
                    <td>{file.metadata?.documentType}</td>
                    <td>{file.metadata?.agreementDate}</td>
                    <td>{file.metadata?.expiryDate}</td>
                    <td>{file.metadata?.signatureName}</td>
                  </tr>
                ))}

                {/* Fill empty rows */}
                {currentRows.length < rowsPerPage &&
                  Array.from({ length: rowsPerPage - currentRows.length }).map((_, i) => (
                    <tr key={`empty-${i}`}>
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
            fetchFiles(); // refresh after upload
          }}
        />
      </div>
    </>
  );
}
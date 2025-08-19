import React, { useEffect, useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import "./RepositoryPage.css";
import { useTranslation } from "react-i18next";

export default function RepositoryPage() {
  const [files, setFiles] = useState([]);
  const [bannerImage, setBannerImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 25;
  const { t } = useTranslation();

  useEffect(() => {
    setBannerImage("/images/banner-placeholder.jpg");
  }, []);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/documents/repository");
        const data = await res.json();
        setFiles(data.files || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchFiles();
  }, []);

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = files.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(files.length / rowsPerPage);

  const goToPage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <DashboardHeader />
      <div className="repository-page">
        <div className="repository-top-space">
          <h1 className="repository-title">{t("repositorypage.repository")}</h1>
        </div>

        <div className="search-bar-container">
          <input
            type="text"
            className="search-bar"
            placeholder={t("repositorypage.search documents...")}
          />
        </div>

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
                  <td>{file.metadata.folder}</td>
                  <td>{file.metadata.counterparty}</td>
                  <td>{file.metadata.documentType}</td>
                  <td>{file.metadata.agreementDate}</td>
                  <td>{file.metadata.expiryDate}</td>
                  <td>{file.metadata.signatureName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
      </div>
    </>
  );
}
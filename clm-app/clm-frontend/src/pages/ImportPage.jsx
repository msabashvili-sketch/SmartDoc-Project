import React, { useEffect, useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import "./ImportPage.css";
import UploadPopup from "../components/uploadPopup/UploadPopup";
import { useTranslation } from "react-i18next";
import { AiOutlineEye } from "react-icons/ai";

export default function ImportPage() {
  const [bannerImage, setBannerImage] = useState(null);
  const [rows, setRows] = useState([]);
  const [allChecked, setAllChecked] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const { t } = useTranslation();

  // Helper: normalize a GridFS/Mongo file doc into safe strings
  const normalizeFiles = (raw = []) =>
    raw.map((f, idx) => {
      let id = "";
      if (typeof f?._id === "string") id = f._id;
      else if (f?._id?.$oid) id = String(f._id.$oid);
      else if (f?._id && typeof f._id.toString === "function") id = f._id.toString();
      else id = `row-${idx}`;

      const metaName = typeof f?.metadata?.filename === "string" ? f.metadata.filename.trim() : "";
      const baseName = typeof f?.filename === "string" ? f.filename.trim() : "";

      const filename = metaName || baseName || "(Untitled)";

      return {
        id,
        filename,
        contentType: typeof f?.contentType === "string" ? f.contentType : "",
        uploadDate: f?.uploadDate ? String(f.uploadDate) : "",
      };
    });

  // Fetch banner image
  useEffect(() => {
    setBannerImage("/images/banner-placeholder.jpg");
  }, []);

  // Fetch uploaded files from backend and normalize them
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch("http://localhost:4000/api/documents");
        const data = await res.json();

        const normalized = normalizeFiles(data?.files || []);
        setFiles(normalized);
        setRows(Array.from({ length: normalized.length }, () => false));
        setAllChecked(false);
      } catch (err) {
        console.error("Error fetching files:", err);
      }
    };
    fetchFiles();
  }, []);

  // Toggle all checkboxes
  const toggleAll = () => {
    const newValue = !allChecked;
    setAllChecked(newValue);
    setRows((prev) => prev.map(() => newValue));
  };

  // Toggle single row checkbox
  const toggleRow = (index) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      setAllChecked(next.every(Boolean));
      return next;
    });
  };

  // ✅ Send selected files to repository
  const sendToRepository = async () => {
    const selectedIds = files.filter((_, idx) => rows[idx]).map(f => f.id);
    if (selectedIds.length === 0) return alert("Please select at least one file");

    try {
      const res = await fetch("http://localhost:4000/api/documents/send-to-repository", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedIds }),
      });

      if (!res.ok) throw new Error("Failed to send files");

      // Remove sent files from import page list
      const remainingFiles = files.filter((_, idx) => !rows[idx]);
      setFiles(remainingFiles);
      setRows(Array.from({ length: remainingFiles.length }, () => false));
      setAllChecked(false);

      alert("Selected files sent to repository successfully!");
    } catch (err) {
      console.error("Send to repository error:", err);
      alert("Error sending files to repository");
    }
  };

  return (
    <>
      <DashboardHeader />

      <div className="import-page">
        <div className="import-top-space">
          <h1 className="import-title">{t("importpage.import")}</h1>
          <label className="upload-button" onClick={() => setIsPopupOpen(true)}>
            {t("importpage.upload document")}
          </label>
        </div>

        <div className="search-bar-container">
          <input
            type="text"
            className="search-bar"
            placeholder={t("importpage.search documents...")}
          />
        </div>

        <div
          className="info-banner"
          style={{
            backgroundImage: bannerImage ? `url(${bannerImage})` : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="info-banner-text">
            <h3>{t("importpage.import")}</h3>
            <p>{t("importpage.upload document")}</p>

            <div className="banner-buttons">
              <button className="banner-send-btn" onClick={sendToRepository}>
                {t("importpage.send to repository")}
              </button>
              <button className="banner-delete-btn">
                {/* You can implement delete functionality later */}
                {t("importpage.delete")}
              </button>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="import-table">
            <thead>
              <tr>
                <th className="sticky-col checkbox-col">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    onChange={toggleAll}
                  />
                </th>
                <th className="sticky-col view-col">{t("importpage.view")}</th>
                <th>{t("importpage.folder")}</th>
                <th>{t("importpage.document title")}</th>
                <th>{t("importpage.counterparty")}</th>
                <th>{t("importpage.document type")}</th>
                <th>{t("importpage.agreement date")}</th>
                <th>{t("importpage.expiry date")}</th>
                <th>{t("importpage.signature name")}</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, index) => (
                <tr key={file.id || index}>
                  <td className="sticky-col checkbox-col">
                    <input
                      type="checkbox"
                      checked={rows[index] || false}
                      onChange={() => toggleRow(index)}
                    />
                  </td>
                  <td className="sticky-col view-col">
                    <button
                      className="view-btn"
                      onClick={() =>
                        window.open(
                          `http://localhost:4000/api/documents/view/${encodeURIComponent(file.id)}`,
                          "_blank"
                        )
                      }
                    >
                      <AiOutlineEye size={18} />
                    </button>
                  </td>
                  <td></td>
                  <td>{file.filename}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="import-content"></div>
      </div>

      <UploadPopup isOpen={isPopupOpen} onClose={() => setIsPopupOpen(false)} />
    </>
  );
}
import React, { useEffect, useState, useCallback } from "react";
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

  // Normalize GridFS files
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

  // Fetch import files from backend
  const fetchFiles = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:4000/api/documents?_=${Date.now()}`);
      const data = await res.json();
      const normalized = normalizeFiles(data?.files || []);
      setFiles(normalized);
      setRows(Array.from({ length: normalized.length }, () => false));
      setAllChecked(false);
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  }, []);

  useEffect(() => {
    setBannerImage("/images/banner-placeholder.jpg");
    fetchFiles();
  }, [fetchFiles]);

  // Toggle all checkboxes
  const toggleAll = () => {
    const newValue = !allChecked;
    setAllChecked(newValue);
    setRows((prev) => prev.map(() => newValue));
  };

  // Toggle single row
  const toggleRow = (index) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      setAllChecked(next.every(Boolean));
      return next;
    });
  };

  // Send selected files to repository
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

      alert("Selected files sent to repository successfully!");
      await fetchFiles();
    } catch (err) {
      console.error("Send to repository error:", err);
      alert("Error sending files to repository");
    }
  };

  // Delete selected files
  const deleteFiles = async () => {
    const selectedIds = files.filter((_, idx) => rows[idx]).map(f => f.id);
    if (selectedIds.length === 0) return alert("Please select at least one file");

    if (!window.confirm("Are you sure you want to delete the selected files?")) return;

    try {
      const res = await fetch("http://localhost:4000/api/documents/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedIds }),
      });

      if (!res.ok) throw new Error("Failed to delete files");

      alert("Selected files deleted successfully!");
      await fetchFiles(); // Refresh file list after deletion
    } catch (err) {
      console.error("Delete files error:", err);
      alert("Error deleting files");
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
              <button className="banner-delete-btn" onClick={deleteFiles}>
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
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} />
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

  {/* Add empty rows to reach 25 if files are less */}
  {Array.from({ length: Math.max(0, 25 - files.length) }).map((_, idx) => (
    <tr key={`empty-${idx}`} className="empty-row">
      <td className="sticky-col checkbox-col"></td>
      <td className="sticky-col view-col"></td>
      <td></td>
      <td></td>
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

      <UploadPopup
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          fetchFiles(); // Refetch after closing popup in case of new uploads
        }}
      />
    </>
  );
}
import React, { useEffect, useState, useCallback } from "react";
import DashboardHeader from "../components/DashboardHeader";
import UploadPopup from "../components/uploadPopup/UploadPopup";
import { AiOutlineEye } from "react-icons/ai";
import "./ImportPage.css";
import { useTranslation } from "react-i18next";

export default function ImportPage() {
  const [bannerImage, setBannerImage] = useState(null);
  const [rows, setRows] = useState([]);
  const [allChecked, setAllChecked] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const { t } = useTranslation();

  const normalizeFiles = (raw = []) =>
    raw.map((f, idx) => {
      let id = f?._id ? f._id.toString() : `row-${idx}`;
      const filename =
        (f?.metadata?.filename?.trim()) ||
        (f?.filename?.trim()) ||
        "(Untitled)";
      return {
        id,
        filename,
        contentType: f?.contentType || "",
        uploadDate: f?.uploadDate ? String(f.uploadDate) : "",
        selectedFolder: f?.folderId || "",
      };
    });

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

  const fetchFolders = useCallback(async () => {
    setLoadingFolders(true);
    try {
      const res = await fetch("http://localhost:4000/api/folders");
      const data = await res.json();
      const normalizedFolders = (data.folders || data).map(f => ({
        id: f._id || f.id,
        name: f.name || f.folderName
      }));
      setFolders(normalizedFolders);
    } catch (err) {
      console.error("Error fetching folders:", err);
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  useEffect(() => {
    setBannerImage("/images/banner-placeholder.jpg");
    fetchFiles();
    fetchFolders();
  }, [fetchFiles, fetchFolders]);

  const toggleAll = () => {
    const newValue = !allChecked;
    setAllChecked(newValue);
    setRows(prev => prev.map(() => newValue));
  };

  const toggleRow = (index) => {
    setRows(prev => {
      const next = [...prev];
      next[index] = !next[index];
      setAllChecked(next.every(Boolean));
      return next;
    });
  };

  const handleFolderChange = (fileId, folderId) => {
    setFiles(prev =>
      prev.map(f => (f.id === fileId ? { ...f, selectedFolder: folderId } : f))
    );
  };

  const sendToRepository = async () => {
    const selectedFiles = files.filter((_, idx) => rows[idx]);
    if (selectedFiles.length === 0) return alert("Please select at least one file");

    const missingFolders = selectedFiles.filter(f => !f.selectedFolder);
    if (missingFolders.length > 0) return alert("Assign a folder to all selected files");

    const filesPayload = selectedFiles.map(f => {
      const folder = folders.find(x => x.id === f.selectedFolder);
      return {
        id: f.id,
        folderId: folder?.id || null,
        folderName: folder?.name || null
      };
    });

    try {
      const res = await fetch("http://localhost:4000/api/documents/send-to-repository", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: filesPayload }),
      });
      if (!res.ok) throw new Error("Failed to send files");
      alert("Selected files sent to repository successfully!");
      await fetchFiles();
    } catch (err) {
      console.error(err);
      alert("Error sending files");
    }
  };

  const deleteFiles = async () => {
    const selectedIds = files.filter((_, idx) => rows[idx]).map(f => f.id);
    if (selectedIds.length === 0) return alert("Select at least one file");
    if (!window.confirm("Are you sure you want to delete selected files?")) return;

    try {
      const res = await fetch("http://localhost:4000/api/documents/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedIds }),
      });
      if (!res.ok) throw new Error("Failed to delete files");
      alert("Selected files deleted successfully!");
      await fetchFiles();
    } catch (err) {
      console.error(err);
      alert("Error deleting files");
    }
  };

  // Determine number of empty rows to fill space till footer
  const getEmptyRowsCount = () => {
    const minVisibleRows = 10; // adjust how many minimum rows to show if few files
    return Math.max(minVisibleRows - files.length, 0);
  };

  return (
    <>
      <DashboardHeader />

      <div className="import-page">

        {/* Top space */}
        <div className="import-top-space">
          <h1 className="import-title">{t("importpage.import")}</h1>
          <label className="upload-button" onClick={() => setIsPopupOpen(true)}>
            <img
              src="/assets/upload-button-icon.png"
              alt="Upload Icon"
              className="upload-button-icon"
            />
            <span style={{ marginLeft: "6px" }}>{t("importpage.upload document")}</span>
          </label>
        </div>

        {/* Search bar row */}
        <div className="search-bar-row">
          <div className="search-bar-container">
            <input
              type="text"
              className="search-bar"
              placeholder={t("importpage.search documents...")}
            />
          </div>
          <button className="columns-button">
            <img
              src="/assets/column-icon.png"
              alt="Columns Icon"
              className="columns-button-icon"
            />
            <span style={{ marginLeft: "6px" }}>{t("importpage.columns")}</span>
          </button>
        </div>

        {/* Scrollable content (banner + table) */}
        <div className="import-content-wrapper">
          {/* Banner */}
          <div
            className="info-banner"
            style={{
              backgroundImage: bannerImage ? `url(${bannerImage})` : "none",
              backgroundSize: "cover",
              backgroundPosition: "center",
              marginBottom: "10px"
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

          {/* Table */}
          <div className="table-container">
            <table className="import-table-new">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                  </th>
                  <th className="view-col">
                    <img
                      src="/assets/view-icon4.png"
                      alt={t("importpage.view")}
                      className="view-header-icon"
                    />
                </th>
                      
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
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={rows[index] || false}
                        onChange={() => toggleRow(index)}
                      />
                    </td>
                    <td className="view-col">
                      <button
                        type="button"
                        className="view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `http://localhost:4000/api/documents/view/${encodeURIComponent(file.id)}`,
                            "_blank"
                          );
                        }}
                      >
                        <img
                          src="/assets/view-icon4.png"
                          alt={t("importpage.view")}
                          className="view-icon"
                        />  
                      </button>
                    </td>
                    <td>
                      <select
                        value={file.selectedFolder}
                        onChange={(e) => handleFolderChange(file.id, e.target.value)}
                      >
                        <option value="">
                          {loadingFolders ? "Loading folders..." : "-- Select Folder --"}
                        </option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{file.filename}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ))}

                {/* Empty rows to fill space till footer */}
                {Array.from({ length: getEmptyRowsCount() }).map((_, idx) => (
                  <tr key={`empty-${idx}`}>
                    {Array.from({ length: 9 }).map((__, cidx) => (
                      <td key={cidx}>&nbsp;</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="page-footer">
            {files.length} {files.length === 1 ? "file" : "files"}
        </div>

        {/* Upload Popup */}
        <UploadPopup
          isOpen={isPopupOpen}
          onClose={() => {
            setIsPopupOpen(false);
            fetchFiles();
          }}
        />
      </div>
    </>
  );
}
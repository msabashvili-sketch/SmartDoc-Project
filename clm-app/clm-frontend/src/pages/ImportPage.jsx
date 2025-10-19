import React, { useEffect, useState, useCallback, useRef } from "react";
import DashboardHeader from "../components/DashboardHeader";
import UploadPopup from "../components/uploadPopup/UploadPopup";
import "./ImportPage.css";
import "../components/ColumnsPopup.css";
import { useTranslation } from "react-i18next";

export default function ImportPage() {
  const [bannerImage, setBannerImage] = useState(null);
  const [rows, setRows] = useState([]);
  const [allChecked, setAllChecked] = useState(false);
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);
  const [isColumnsPopupOpen, setIsColumnsPopupOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [searchQuery, setSearchQuery] = useState(""); // Search bar state
  const [message, setMessage] = useState("");         // Custom popup text
  const [messageType, setMessageType] = useState(""); // "success" | "error"
  const [showMessage, setShowMessage] = useState(false); // Toggle popup
  const { t } = useTranslation();

  const columnsButtonRef = useRef(null);
  const columnsPopupRef = useRef(null);

  const popupOffsetY = 4;
  const popupOffsetX = -168;

  const columns = [
    { key: "folder", label: t("importpage.folder") },
    { key: "documentTitle", label: t("importpage.document title") },
    { key: "counterparty", label: t("importpage.counterparty") },
    { key: "documentType", label: t("importpage.document type") },
    { key: "agreementDate", label: t("importpage.agreement date") },
    { key: "expiryDate", label: t("importpage.expiry date") },
    { key: "signatureName", label: t("importpage.signature name") },
  ];

  const [visibleColumns, setVisibleColumns] = useState(columns.map(col => col.key));

  const handleToggleColumn = (key) => {
    setVisibleColumns(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

 const normalizeFiles = (raw = []) =>
  raw.map((f, idx) => {
    const id = f?.id || `row-${idx}`;
    const filename = f?.originalName || "(Untitled)";
    return {
      id,
      filename,
      contentType: f?.mimetype || "",
      uploadDate: f?.createdAt ? new Date(f.createdAt).toLocaleString() : "",
      selectedFolder: f?.folderId || "",
      documentType: f?.documentType || "",
      counterparty: f?.counterparty || "",
      agreementDate: f?.agreementDate || "",
      expiryDate: f?.expiryDate || "",
      signatureName: f?.signatureName || "",
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
    setBannerImage("/assets/import-page-banner5.jpg");
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
    if (selectedFiles.length === 0) {
      setMessage(t("importpage.Please select at least one file"));
      setMessageType("error");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    const missingFolders = selectedFiles.filter(f => !f.selectedFolder);
    if (missingFolders.length > 0) {
      setMessage(t("importpage.Assign a folder to all selected files"));
      setMessageType("error");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

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

      setMessage(t("importpage.Selected files sent to repository successfully!"));
      setMessageType("success");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);

      await fetchFiles();
    } catch (err) {
      console.error(err);
      setMessage("Error sending files");
      setMessageType("error");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };

  const deleteFiles = async () => {
    const selectedIds = files.filter((_, idx) => rows[idx]).map(f => f.id);
    if (selectedIds.length === 0) {
      setMessage(t("importpage.Please select at least one file"));
      setMessageType("error");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    try {
      const res = await fetch("http://localhost:4000/api/documents/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: selectedIds }),
      });
      if (!res.ok) throw new Error("Failed to delete files");

      setMessage(t("importpage.Selected files deleted successfully!"));
      setMessageType("success");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);

      await fetchFiles();
    } catch (err) {
      console.error(err);
      setMessage("Error deleting files");
      setMessageType("error");
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    }
  };

  const getEmptyRowsCount = () => {
    const minVisibleRows = 10;
    return Math.max(minVisibleRows - files.length, 0);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        columnsPopupRef.current &&
        !columnsPopupRef.current.contains(e.target) &&
        columnsButtonRef.current &&
        !columnsButtonRef.current.contains(e.target)
      ) {
        setIsColumnsPopupOpen(false);
      }
    };
    if (isColumnsPopupOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isColumnsPopupOpen]);

  // Filter files based on search query
  const filteredFiles = files.filter(file => {
    const query = searchQuery.toLowerCase();
    return Object.keys(file).some(key => {
      if (typeof file[key] === "string") {
        return file[key].toLowerCase().includes(query);
      }
      return false;
    });
  });

  return (
    <>
      <DashboardHeader />

      {/* ===== Custom Message Popup ===== */}
      {showMessage && (
        <div className={`custom-message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="import-page">
        <div className="import-top-space">
          <h1 className="import-title">{t("importpage.import")}</h1>
          <label className="upload-button" onClick={() => setIsUploadPopupOpen(true)}>
            <img src="/assets/upload-button-icon.png" alt="Upload Icon" className="upload-button-icon" />
            <span style={{ marginLeft: "6px" }}>{t("importpage.upload document")}</span>
          </label>
        </div>

        {/* Search bar + columns toggle */}
        <div className="search-bar-row">
          <div className="search-bar-container">
            <input
              type="text"
              className="search-bar"
              placeholder={t("importpage.search documents...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="columns-button"
            ref={columnsButtonRef}
            onClick={() => setIsColumnsPopupOpen(prev => !prev)}
          >
            <img src="/assets/column-icon.png" alt="Columns Icon" className="columns-button-icon" />
            <span style={{ marginLeft: "6px" }}>{t("importpage.columns")}</span>
          </button>

          {isColumnsPopupOpen && columnsButtonRef.current && (
            <div
              className="columns-popup"
              ref={columnsPopupRef}
              style={{
                position: "absolute",
                top: columnsButtonRef.current.getBoundingClientRect().bottom + window.scrollY + popupOffsetY,
                left: columnsButtonRef.current.getBoundingClientRect().left + window.scrollX + popupOffsetX,
                zIndex: 1000
              }}
            >
              <h4>{t("importpage.select columns")}</h4>
              <ul>
                {columns.map(col => (
                  <li key={col.key}>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(col.key)}
                        onChange={() => handleToggleColumn(col.key)}
                      />
                      <span className="slider"></span>
                      {col.label}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Custom banner + table */}
        <div className="import-content-wrapper">
          {bannerImage && (
            <div
              className="info-banner"
              style={{
                backgroundImage: `url(${bannerImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                marginBottom: "10px",
              }}
            >
              <div className="info-banner-text">
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
          )}

          <div className="table-container">
            <table className="import-table-new">
              <thead>
                <tr>
                  <th className="checkbox-col sticky">
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                  </th>
                  <th className="view-col sticky">
                    <img src="/assets/view-icon4.png" alt={t("importpage.view")} className="view-header-icon" />
                  </th>
                  {columns.filter(col => visibleColumns.includes(col.key)).map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file, index) => {
                  const isSelected = rows[index];
                  return (
                    <tr key={file.id || index} className={isSelected ? "selected-row" : ""}>
                      <td className="checkbox-col sticky">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(index)}
                        />
                      </td>
                      <td className="view-col sticky">
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
                          <img src="/assets/view-icon4.png" alt={t("importpage.view")} className="view-icon" />
                        </button>
                      </td>
                      {columns.filter(col => visibleColumns.includes(col.key)).map(col => (
                        <td key={col.key}>
                          {col.key === "folder" ? (
                            <select
                              value={file.selectedFolder}
                              onChange={(e) => handleFolderChange(file.id, e.target.value)}
                            >
                              <option value="">
                                 {loadingFolders ? t("importpage.loading...") : t("importpage.select folder")}
                              </option>
                              {folders.map(f => (
                                <option key={f.id} value={f.id}>{f.name}</option>
                              ))}
                            </select>
                          ) : col.key === "documentTitle" ? (
                            file.filename
                          ) : (
                            file[col.key] || ""
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="page-footer">
          {files.length} {t("importpage.files_already_uploaded")}
         </div>

        <UploadPopup
          isOpen={isUploadPopupOpen}
          onClose={() => {
            setIsUploadPopupOpen(false);
            fetchFiles();
          }}
        />
      </div>
    </>
  );
}
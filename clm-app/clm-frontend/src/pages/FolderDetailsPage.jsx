// src/pages/FolderDetailsPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "./FolderDetailsPage.css";
import { useTranslation } from "react-i18next";

export default function FolderDetailsPage({ folderId, onBack, onDocumentClick }) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [folders, setFolders] = useState([]);
  const [filterType, setFilterType] = useState("repository"); // "repository" or "archive"
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState(null);

  const [showMovePopup, setShowMovePopup] = useState(false);
  const [moveDocId, setMoveDocId] = useState(null);
  const [targetFolderId, setTargetFolderId] = useState("");
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [showMoveSuccess, setShowMoveSuccess] = useState(false);

  // ---- Normalizers ----
  const normalizeFolders = (raw = []) =>
    raw.map((f) => ({
      id: f.id || f.firestoreId || null,
      rawId: f.id || f.firestoreId || null,
      name: f.name || f.folderName || "(Untitled)",
      fileCount: f.fileCount ?? 0,
      __raw: f,
    }));

  const normalizeDocuments = (raw = []) =>
    raw.map((d, idx) => {
      let date = "", time = "";
      if (d.createdAt) {
        const dt = d.createdAt._seconds ? new Date(d.createdAt._seconds * 1000) : new Date(d.createdAt);
        date = dt.toLocaleDateString();
        time = dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      }
      return {
        id: d.id || d._id || d.firestoreId || `doc-${idx}`,
        originalName: d.originalName || d.filename || d.name || "(Untitled)",
        folderId: d.folderId || null,
        repository: !!d.repository,
        archived: !!d.archived,
        date,
        time,
        __raw: d,
      };
    });

  // ---- Fetch folders ----
  const fetchFolders = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/folders");
      const list = Array.isArray(res.data) ? res.data : res.data.folders || [];
      const normalized = normalizeFolders(list);
      setFolders(normalized);

      if (folderId) {
        const match = normalized.find((f) => f.id === folderId || f.rawId === folderId);
        setFolderName(match ? match.name : t("detailspanel.folderDocuments"));
      }
    } catch (err) {
      console.error("Error fetching folders:", err);
    }
  }, [folderId, t]);

  // ---- Fetch documents ----
  const fetchDocuments = useCallback(async () => {
    if (!folderId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:4000/api/documents/by-folder/${encodeURIComponent(folderId)}?page=${encodeURIComponent(filterType)}`
      );
      const list = res.data.files || res.data || [];
      const normalized = normalizeDocuments(list);
      setDocuments(normalized);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [folderId, filterType]);

  useEffect(() => {
    if (!folderId) return;
    fetchFolders();
    fetchDocuments();
  }, [folderId, filterType, fetchFolders, fetchDocuments]);

  // ---- Delete document ----
  const handleDeleteClick = (docId) => {
    setDeleteDocId(docId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.post("http://localhost:4000/api/documents/delete", {
        fileIds: [deleteDocId],
      });
      await fetchDocuments();
    } catch (err) {
      console.error("Delete failed:", err);
      alert(t("detailspanel.deleteFailed") || "Delete failed");
    } finally {
      setShowDeleteConfirm(false);
      setDeleteDocId(null);
    }
  };

  // ---- Move document ----
  const handleMoveClick = (docId) => {
    setMoveDocId(docId);
    setTargetFolderId("");
    setShowMoveSuccess(false);
    setShowMovePopup(true);
  };

  const handleConfirmMove = async () => {
    if (!targetFolderId) return;
    try {
      await axios.post("http://localhost:4000/api/documents/move-folder", {
        files: [
          {
            id: moveDocId,
            folderId: targetFolderId,
            folderName: folders.find((f) => f.id === targetFolderId)?.name || null,
          },
        ],
      });

      setShowMoveSuccess(true);
      setTimeout(async () => {
        setShowMovePopup(false);
        setShowMoveSuccess(false);
        setMoveDocId(null);
        setTargetFolderId("");
        await fetchDocuments();
      }, 1200);
    } catch (err) {
      console.error("Move failed:", err);
      alert(t("folderdetailspanel.moveFailed") || "Move failed");
      setShowMovePopup(false);
      setMoveDocId(null);
      setTargetFolderId("");
    }
  };

  return (
    <div className="folder-documents-page">
      <div className="folder-details-header">
        <button className="back-button" onClick={onBack}>
          ← {t("folderdetailspanel.back") || "Back"}
        </button>

        <div className="folder-title-container">
          <img
            src="/assets/folder-big-icon5.png"
            alt="Folder Icon"
            className="folder-header-icon"
          />
          <h2 className="folder-title">{folderName || ""}</h2>
        </div>

        <div className="folder-header-buttons">
          <button
            className={filterType === "repository" ? "active" : ""}
            onClick={() => setFilterType("repository")}
          >
            {t("folderdetailspanel.repository") || "Repository"}
          </button>
          <button
            className={filterType === "archive" ? "active" : ""}
            onClick={() => setFilterType("archive")}
          >
            {t("folderdetailspanel.archive") || "Archive"}
          </button>
        </div>
      </div>

      {/* Documents Table */}
      {loading ? (
        <p className="no-documents-text">{t("folderdetailspanel.loading")}</p>
      ) : documents.length === 0 ? (
        <p className="no-documents-text">{t("folderdetailspanel.noDocuments")}</p>
      ) : (
        <table className="documents-table">
          <colgroup>
            <col style={{ width: "55%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>{t("folderdetailspanel.fileName") || "File name"}</th>
              <th>{t("folderdetailspanel.uploadedOn") || "Uploaded on"}</th>
              <th>{t("folderdetailspanel.actions") || "Actions"}</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr
                key={doc.id}
                className={selectedDocId === doc.id ? "selected-row" : ""}
                onClick={() => {
                  setSelectedDocId(doc.id);
                  if (onDocumentClick) onDocumentClick(doc);
                }}
              >
                <td className="td-filename">
                  <span className="filename-text">{doc.originalName}</span>
                </td>
                <td className="td-uploaded">
                  <div className="date">{doc.date}</div>
                  <div className="time">{doc.time}</div>
                </td>
                <td className="td-actions">
                  <div className="actions-container">
                    <button
                      className="action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `http://localhost:4000/api/documents/view/${encodeURIComponent(doc.id)}`,
                          "_blank"
                        );
                      }}
                    >
                      <img
                        src="/assets/view-icon4.png"
                        alt={t("folderdetailspanel.view") || "View"}
                        className="action-icon"
                      />
                    </button>

                    <button
                      className="action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMoveClick(doc.id);
                      }}
                    >
                      <img
                        src="/assets/folder-big-icon7.png"
                        alt={t("folderdetailspanel.move") || "Move"}
                        className="action-icon"
                      />
                    </button>

                    <button
                      className="action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(doc.id);
                      }}
                    >
                      <img
                        src="/assets/delete-icon.png"
                        alt={t("folderdetailspanel.delete") || "Delete"}
                        className="action-icon"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p>{t("folderdetailspanel.confirmDelete") || "Confirm delete?"}</p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setShowDeleteConfirm(false)}>
                {t("folderdetailspanel.cancel") || "Cancel"}
              </button>
              <button className="confirm-delete" onClick={handleConfirmDelete}>
                {t("folderdetailspanel.delete") || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Popup */}
      {showMovePopup && (
        <div className="confirm-overlay">
          <div className="new-folder-popup move-popup">
            {showMoveSuccess ? (
              <div className="success-message">{t("folderdetailspanel.moveSuccess") || "Moved successfully!"}</div>
            ) : (
              <>
                <input type="text" value={folderName} disabled />
                <select value={targetFolderId} onChange={(e) => setTargetFolderId(e.target.value)}>
                  <option value="">{t("folderdetailspanel.selectFolder") || "Select folder"}</option>
                  {folders.filter((f) => f.id !== folderId).map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
                <div className="new-folder-popup-buttons">
                  <button className="cancel-btn" onClick={() => setShowMovePopup(false)}>
                    {t("folderdetailspanel.cancel") || "Cancel"}
                  </button>
                  <button className="create-btn" onClick={handleConfirmMove}>
                    {t("folderdetailspanel.move") || "Move"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
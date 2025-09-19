// src/pages/FolderDetailsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./FolderDetailsPage.css";
import { useTranslation } from "react-i18next";

export default function FolderDetailsPage({ folderId, onBack, onDocumentClick }) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [folders, setFolders] = useState([]);
  const [filterType, setFilterType] = useState("repository"); // filter state

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState(null);

  const [showMovePopup, setShowMovePopup] = useState(false);
  const [moveDocId, setMoveDocId] = useState(null);
  const [targetFolderId, setTargetFolderId] = useState("");

  const [selectedDocId, setSelectedDocId] = useState(null);

  // Fetch folder name
  useEffect(() => {
    const fetchFolderName = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/folders`);
        const folder = res.data.find((f) => f._id === folderId);
        setFolderName(folder ? folder.name : t("detailspanel.folderDocuments"));
        setFolders(res.data || []);
      } catch (err) {
        console.error("Error fetching folder name:", err);
      }
    };

    if (folderId) fetchFolderName();
  }, [folderId, t]);

  // Fetch documents whenever folderId or filterType changes
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/api/documents/by-folder/${folderId}?page=${filterType}`
        );
        setDocuments(res.data.files || []);
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };

    if (folderId) fetchDocuments();
  }, [folderId, filterType]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  // Delete document
  const handleDeleteClick = (docId) => {
    setDeleteDocId(docId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await axios.post("http://localhost:4000/api/documents/delete", {
        fileIds: [deleteDocId],
      });
      setDocuments((prev) => prev.filter((doc) => doc._id !== deleteDocId));
    } catch (err) {
      console.error("Delete failed:", err);
      alert(t("detailspananel.deleteFailed"));
    } finally {
      setShowDeleteConfirm(false);
      setDeleteDocId(null);
    }
  };

  // Move document
  const handleMoveClick = (docId) => {
    setMoveDocId(docId);
    setTargetFolderId("");
    setShowMovePopup(true);
  };

  const handleConfirmMove = async () => {
    if (!targetFolderId) return;

    try {
      await axios.post("http://localhost:4000/api/documents/send-to-repository", {
        files: [
          {
            id: moveDocId,
            folderId: targetFolderId,
            folderName: folders.find((f) => f._id === targetFolderId)?.name,
          },
        ],
      });
      setDocuments((prev) => prev.filter((doc) => doc._id !== moveDocId));
    } catch (err) {
      console.error("Move failed:", err);
      alert(t("folderdetailspanel.moveFailed"));
    } finally {
      setShowMovePopup(false);
      setMoveDocId(null);
      setTargetFolderId("");
    }
  };

  return (
    <div className="folder-documents-page">
      {/* Header */}
      <div className="folder-details-header">
        <button className="back-button" onClick={onBack}>
          ← {t("folderdetailspanel.back")}
        </button>

        <div className="folder-title-container">
          <img
            src="/assets/folder-big-icon5.png"
            alt="Folder Icon"
            className="folder-header-icon"
          />
          <h2 className="folder-title">{folderName}</h2>
        </div>

        {/* Filter buttons */}
        <div className="folder-header-buttons">
          <button
            className={filterType === "repository" ? "active" : ""}
            onClick={() => setFilterType("repository")}
          >
            Repository
          </button>
          <button
            className={filterType === "archive" ? "active" : ""}
            onClick={() => setFilterType("archive")}
          >
            Archive
          </button>
        </div>
      </div>

      {/* Documents Table */}
      {documents.length === 0 ? (
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
              <th>{t("folderdetailspanel.fileName")}</th>
              <th>{t("folderdetailspanel.uploadedOn")}</th>
              <th>{t("folderdetailspanel.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const { date, time } = formatDateTime(doc.uploadDate);
              return (
                <tr
                  key={doc._id}
                  className={selectedDocId === doc._id ? "selected-row" : ""}
                  onClick={() => {
                    setSelectedDocId(doc._id);
                    if (onDocumentClick) onDocumentClick(doc);
                  }}
                >
                  <td className="td-filename">
                    <span className="filename-text">{doc.filename}</span>
                  </td>
                  <td className="td-uploaded">
                    <div className="date">{date}</div>
                    <div className="time">{time}</div>
                  </td>
                  <td className="td-actions">
                    <div className="actions-container">
                      {/* View */}
                      <button
                        className="action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(
                            `http://localhost:4000/api/documents/view/${doc._id}`,
                            "_blank"
                          );
                        }}
                      >
                        <img
                          src="/assets/view-icon4.png"
                          alt={t("folderdetailspanel.view")}
                          className="action-icon"
                        />
                      </button>

                      {/* Move */}
                      <button
                        className="action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveClick(doc._id);
                        }}
                      >
                        <img
                          src="/assets/folder-big-icon7.png"
                          alt={t("folderdetailspanel.move")}
                          className="action-icon"
                        />
                      </button>

                      {/* Delete */}
                      <button
                        className="action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(doc._id);
                        }}
                      >
                        <img
                          src="/assets/delete-icon.png"
                          alt={t("folderdetailspanel.delete")}
                          className="action-icon"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="confirm-overlay">
          <div className="confirm-box">
            <p>{t("folderdetailspanel.confirmDelete")}</p>
            <div className="confirm-actions">
              <button
                className="confirm-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                {t("folderdetailspanel.cancel")}
              </button>
              <button className="confirm-delete" onClick={handleConfirmDelete}>
                {t("folderdetailspanel.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Popup */}
      {showMovePopup && (
        <div className="confirm-overlay">
          <div className="new-folder-popup move-popup">
            <input type="text" value={folderName} disabled />
            <select
              value={targetFolderId}
              onChange={(e) => setTargetFolderId(e.target.value)}
            >
              <option value="">{t("folderdetailspanel.selectFolder")}</option>
              {folders
                .filter((f) => f._id !== folderId)
                .map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
            </select>
            <div className="new-folder-popup-buttons">
              <button
                className="cancel-btn"
                onClick={() => setShowMovePopup(false)}
              >
                {t("folderdetailspanel.cancel")}
              </button>
              <button className="create-btn" onClick={handleConfirmMove}>
                {t("folderdetailspanel.move")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
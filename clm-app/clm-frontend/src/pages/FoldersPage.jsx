// src/pages/FoldersPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardHeader from "../components/DashboardHeader";
import UploadPopup from "../components/uploadPopup/UploadPopup";
import FolderDetailsPage from "./FolderDetailsPage";
import "../components/PageLayout.css";
import "./FoldersPage.css";
import { useTranslation } from "react-i18next";
import axios from "axios";

export default function FoldersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { folderId: paramFolderId } = useParams();

  const [showUploadButton] = useState(true);
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);

  // New folder popup
  const [isNewFolderPopupOpen, setIsNewFolderPopupOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderBtnRef = useRef(null);
  const popupRef = useRef(null);

  // Folders state
  const [folders, setFolders] = useState([]);
  const [totalDocuments, setTotalDocuments] = useState(0);

  // Folder view state
  const [viewMode, setViewMode] = useState("folders");
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Document preview state
  const [previewDocument, setPreviewDocument] = useState(null);

  // Delete state (multiple selection allowed)
  const [selectedForDelete, setSelectedForDelete] = useState([]);
  const [showDeletePopup, setShowDeletePopup] = useState(false);

  // Move popup state
  const [isMovePopupOpen, setIsMovePopupOpen] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState("");

  // Confirm delete modal state
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [foldersToConfirmDelete, setFoldersToConfirmDelete] = useState([]);

  // Close new-folder popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        newFolderBtnRef.current &&
        !newFolderBtnRef.current.contains(event.target)
      ) {
        setIsNewFolderPopupOpen(false);
      }
    }
    if (isNewFolderPopupOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNewFolderPopupOpen]);

  // Fetch folders with file counts from backend
  const fetchFolders = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/folders");
      const foldersData = response.data || [];
      setFolders(foldersData);

      const totalDocs = foldersData.reduce(
        (sum, f) => sum + (f.fileCount ?? 0),
        0
      );
      setTotalDocuments(totalDocs);

      if (paramFolderId) {
        const folder = foldersData.find((f) => f.id === paramFolderId);
        if (folder) {
          setSelectedFolder(folder);
          setViewMode("folderContents");
        }
      }
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, [paramFolderId]);

  const handleUploadClick = () => setIsUploadPopupOpen(true);
  const handleNewFolderClick = () => setIsNewFolderPopupOpen((prev) => !prev);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const response = await axios.post("http://localhost:4000/api/folders", {
        name: newFolderName.trim(),
      });
      setFolders((prev) => [{ ...response.data, fileCount: 0 }, ...prev]);
      setNewFolderName("");
      setIsNewFolderPopupOpen(false);
    } catch (err) {
      console.error("Failed to create folder:", err);
    }
  };

  const handleCancel = () => {
    setNewFolderName("");
    setIsNewFolderPopupOpen(false);
  };

  const handleFolderClick = (folder) => {
    setSelectedFolder(folder);
    setViewMode("folderContents");
    navigate(`/folders/${folder.id}`);
    setPreviewDocument(null);
  };

  const handleBackClick = () => {
    setSelectedFolder(null);
    setViewMode("folders");
    navigate("/folders");
    setPreviewDocument(null);
  };

  const handleDocumentClick = (doc) => {
    setPreviewDocument(doc);
  };

  const handleToggleSelect = (folderId, checked) => {
    setSelectedForDelete((prev) => {
      let next;
      if (checked) {
        next = prev.includes(folderId) ? prev : [...prev, folderId];
      } else {
        next = prev.filter((id) => id !== folderId);
      }
      setShowDeletePopup(next.length > 0);
      return next;
    });
  };

  const selectedHasNonEmpty = selectedForDelete.some(
    (id) => folders.find((f) => f.id === id)?.fileCount > 0
  );

  // --- Move folders logic ---
  const handleMoveFolders = async () => {
    if (!targetFolderId) return alert(t("folderspage.selectTargetFolder"));

    try {
      for (let folderId of selectedForDelete) {
        await axios.post("http://localhost:4000/api/folders/move", {
          folderId,
          targetFolderId,
        });
      }

      fetchFolders();
      setSelectedForDelete([]);
      setTargetFolderId("");
      setIsMovePopupOpen(false);
      setShowDeletePopup(false);
    } catch (err) {
      console.error("Failed to move folders:", err);
      alert(t("folderspage.moveFailed"));
    }
  };

  return (
    <div className="page-layout">
      <DashboardHeader />

      <div className="top-space">
        {viewMode === "folders" && (
          <>
            <h1 className="top-space-title">{t("folderspage.title")}</h1>
            {showUploadButton && (
              <label className="upload-button" onClick={handleUploadClick}>
                <img
                  src="/assets/upload-button-icon.png"
                  alt="Upload Icon"
                  className="upload-button-icon"
                />
                <span style={{ marginLeft: "6px" }}>
                  {t("folderspage.upload document")}
                </span>
              </label>
            )}
          </>
        )}
      </div>

      <UploadPopup
        isOpen={isUploadPopupOpen}
        onClose={() => {
          setIsUploadPopupOpen(false);
          fetchFolders();
        }}
      />

      <div className="folders-layout">
        <div className="folders-sidebar">
          <div className="folders-header">
            <div className="folders-header-left">
              <img
                src="/assets/folder-icon.png"
                alt="Folder Icon"
                className="folder-icon"
              />
              <span>{t("folderspage.documents")}</span>
            </div>

            <div className="new-folder-container" style={{ position: "relative" }}>
              <button
                className="new-folder-btn"
                onClick={handleNewFolderClick}
                ref={newFolderBtnRef}
              >
                <img
                  src="/assets/plus-icon.png"
                  alt="Folder Icon"
                  className="btn-icon"
                />  
                {t("folderspage.new folder")}
              </button>

              {isNewFolderPopupOpen && (
                <div className="new-folder-popup" ref={popupRef}>
                  <input
                    type="text"
                    placeholder={t("folderspage.folder name")}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <div className="new-folder-popup-buttons">
                    <button className="cancel-btn" onClick={handleCancel}>
                      {t("folderspage.cancel")}
                    </button>
                    <button className="create-btn" onClick={handleCreateFolder}>
                      {t("folderspage.create")}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="folders-body">
            {viewMode === "folders" ? (
              folders.length === 0 ? (
                <p>{t("folderspage.no folders")}</p>
              ) : (
                <div className="folders-grid">
                  {folders.map((folder) => (
                    <div className="folder-item" key={folder.id}>
                      <div className="folder-icon-wrapper">
                        <img
                          src="/assets/folder-big-icon10.png"
                          alt="Folder"
                          className="folder-grid-icon"
                          onClick={() => handleFolderClick(folder)}
                        />
                        <span className="folder-badge">
                          {folder.fileCount ?? 0}
                        </span>

                        <input
                          type="checkbox"
                          className="folder-delete-checkbox"
                          checked={selectedForDelete.includes(folder.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleToggleSelect(folder.id, e.target.checked)
                          }
                        />
                      </div>
                      <span className="folder-name">{folder.name}</span>
                    </div>
                  ))}
                </div>
              )
            ) : selectedFolder ? (
              <FolderDetailsPage
                folderId={selectedFolder.id}
                onBack={handleBackClick}
                onDocumentClick={handleDocumentClick}
              />
            ) : null}
          </div>

          <div className="folders-footer">
            {t("folderspage.totalFolders")}: {folders.length} |{" "}
            {t("folderspage.totalDocuments")}: {totalDocuments}
          </div>
        </div>

        <div className="extra-area">
          {!previewDocument && (
            <div className="empty-preview">
              <img
                src="/assets/brand-logo2.png"
                alt="Brand Logo"
                className="brand-logo"
              />
            </div>
          )}
          {previewDocument && (
            <iframe
              src={`http://localhost:4000/api/documents/view/${previewDocument.id}`}
              title={previewDocument.filename}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}
        </div>
      </div>

      {/* Bottom popup with Move/Delete */}
      {selectedForDelete.length > 0 && (
        <div
          className={`bottom-popup wide-popup ${showDeletePopup ? "show" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="popup-left">
            {selectedForDelete.length} {t("folderspage.selected")}
          </div>

          <button
            className="move-btn"
            onClick={() => setIsMovePopupOpen(true)}
            aria-label="Move selected folders"
          >
            <img
              src="/assets/folder-small-icon10.png"
              alt="Move"
              className="popup-icon"
            />
          </button>

          <button
            className="delete-btn"
            onClick={() => {
              setFoldersToConfirmDelete(selectedForDelete);
              setShowConfirmDelete(true);
            }}
            disabled={selectedHasNonEmpty}
            aria-label="Delete selected folders"
          >
            <img src="/assets/trash-icon2.png" alt="Delete" className="delete-icon" />
          </button>

          <button
            className="cancel-btn"
            onClick={() => {
              setSelectedForDelete([]);
              setShowDeletePopup(false);
            }}
          >
            {t("folderspage.cancel")}
          </button>
        </div>
      )}

      {/* Move Popup */}
      {isMovePopupOpen && (
        <div className="confirm-overlay" onClick={() => setIsMovePopupOpen(false)}>
          <div
            className="new-folder-popup move-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="move-popup-title">{t("folderspage.move folders")}</h3>

            <select
              value={targetFolderId}
              onChange={(e) => setTargetFolderId(e.target.value)}
            >
              <option value="">{t("folderspage.selectTargetFolder")}</option>
              {folders
                .filter((f) => !selectedForDelete.includes(f.id))
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
            </select>

            <div className="new-folder-popup-buttons">
              <button
                className="cancel-btn"
                onClick={() => setIsMovePopupOpen(false)}
              >
                {t("folderspage.cancel")}
              </button>
              <button className="create-btn" onClick={handleMoveFolders}>
                {t("folderspage.move")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Popup */}
      {showConfirmDelete && (
        <div className="modal-overlay" onClick={() => setShowConfirmDelete(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="modal-text">{t("folderspage.confirmDeleteMessage")}</p>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowConfirmDelete(false)}
              >
                {t("folderspage.cancel")}
              </button>
              <button
                className="delete-btn"
                onClick={async () => {
                  try {
                    await Promise.all(
                      foldersToConfirmDelete.map(async (folderId) => {
                        const folder = folders.find((f) => f.id === folderId);
                        if (folder && (folder.fileCount ?? 0) === 0) {
                          await axios.delete(`http://localhost:4000/api/folders/${folderId}`);
                        }
                      })
                    );
                    setSelectedForDelete([]);
                    setFoldersToConfirmDelete([]);
                    setShowDeletePopup(false);
                    setShowConfirmDelete(false);
                    fetchFolders();
                  } catch (err) {
                    console.error("Failed to delete folders:", err);
                  }
                }}
              >
                {t("folderspage.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
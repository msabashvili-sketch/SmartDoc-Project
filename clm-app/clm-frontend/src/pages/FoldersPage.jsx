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

  // Upload popup
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);

  // New folder popup
  const [isNewFolderPopupOpen, setIsNewFolderPopupOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderBtnRef = useRef(null);
  const popupRef = useRef(null);

  // Folders state
  const [folders, setFolders] = useState([]);

  // Folder view state
  const [viewMode, setViewMode] = useState("folders"); // "folders" or "folderContents"
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Document preview state
  const [previewDocument, setPreviewDocument] = useState(null); // store clicked document

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

  // Fetch folders from backend
  const fetchFolders = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/folders");
      setFolders(response.data || []);

      if (paramFolderId) {
        const folder = response.data.find((f) => f._id === paramFolderId);
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

  // Handlers
  const handleUploadClick = () => setIsUploadPopupOpen(true);
  const handleNewFolderClick = () => setIsNewFolderPopupOpen((prev) => !prev);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const response = await axios.post("http://localhost:4000/api/folders", {
        name: newFolderName.trim(),
      });
      setFolders((prev) => [response.data, ...prev]);
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
    navigate(`/folders/${folder._id}`);
    setPreviewDocument(null);
  };

  const handleBackClick = () => {
    setSelectedFolder(null);
    setViewMode("folders");
    navigate("/folders");
    setPreviewDocument(null);
  };

  // Callback when a document row is clicked in FolderDetailsPage
  const handleDocumentClick = (doc) => {
    setPreviewDocument(doc);
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
        {/* Sidebar */}
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
                + {t("folderspage.new folder")}
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
                    <div
                      className="folder-item"
                      key={folder._id}
                      onClick={() => handleFolderClick(folder)}
                    >
                      <div className="folder-icon-wrapper">
                        <img
                          src="/assets/folder-big-icon7.png"
                          alt="Folder"
                          className="folder-grid-icon"
                        />
                      </div>
                      <span className="folder-name">{folder.name}</span>
                    </div>
                  ))}
                </div>
              )
            ) : selectedFolder ? (
              <FolderDetailsPage
                folderId={selectedFolder._id}
                onBack={handleBackClick}
                onDocumentClick={handleDocumentClick} // row click callback
              />
            ) : null}
          </div>

          <div className="folders-footer">{t("folderspage.footer")}</div>
        </div>

        {/* Document preview area */}
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
              src={`http://localhost:4000/api/documents/view/${previewDocument._id}`}
              title={previewDocument.filename}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
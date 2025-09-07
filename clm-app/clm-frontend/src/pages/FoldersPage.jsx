// src/pages/FoldersPage.jsx
import React, { useState, useRef, useEffect } from "react";
import DashboardHeader from "../components/DashboardHeader";
import UploadPopup from "../components/uploadPopup/UploadPopup"; // make sure this path matches your project
import "../components/PageLayout.css"; // header + top-space styles
import "./FoldersPage.css"; // folder-page specific styles
import { useTranslation } from "react-i18next";
import axios from "axios";

export default function FoldersPage() {
  const { t } = useTranslation();
  const [showUploadButton] = useState(true);

  // Upload popup
  const [isUploadPopupOpen, setIsUploadPopupOpen] = useState(false);

  // New folder popup state
  const [isNewFolderPopupOpen, setIsNewFolderPopupOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const newFolderBtnRef = useRef(null);
  const popupRef = useRef(null);

  // Folders state
  const [folders, setFolders] = useState([]);

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
    } catch (err) {
      console.error("Failed to fetch folders:", err);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // Handlers
  const handleUploadClick = () => {
    setIsUploadPopupOpen(true);
  };

  const handleNewFolderClick = () => {
    setIsNewFolderPopupOpen((prev) => !prev);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await axios.post("http://localhost:4000/api/folders", {
        name: newFolderName.trim(),
      });

      // Add new folder to state (prepend)
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

  return (
    <div className="page-layout">
      {/* Header */}
      <DashboardHeader />

      {/* Top space */}
      <div className="top-space">
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
      </div>

      {/* Upload popup - pass isOpen (important) */}
      <UploadPopup
        isOpen={isUploadPopupOpen}
        onClose={() => {
          setIsUploadPopupOpen(false);
          // refresh folders/documents after upload
          fetchFolders();
        }}
      />

      {/* Main content */}
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

              {/* Popup */}
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

          {/* Folder icons area */}
          <div className="folders-body">
            {folders.length === 0 ? (
              <p>{t("folderspage.no folders")}</p>
            ) : (
              <div className="folders-grid">
                {folders.map((folder) => (
                  <div className="folder-item" key={folder._id}>
                    <div className="folder-icon-wrapper">
                      <img
                        src="/assets/folder-big-icon3.png"
                        alt="Folder"
                        className="folder-grid-icon"
                      />
                    </div>
                    <span className="folder-name">{folder.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="folders-footer">{t("folderspage.footer")}</div>
        </div>
      </div>
    </div>
  );
}
// src/pages/FolderDetailsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./FolderDetailsPage.css";

export default function FolderDetailsPage({ folderId, onBack }) {
  const [documents, setDocuments] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteDocId, setDeleteDocId] = useState(null);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get(
          `http://localhost:4000/api/documents/by-folder/${folderId}`
        );
        setDocuments(res.data.files || []);
      } catch (err) {
        console.error("Error fetching documents:", err);
      }
    };

    const fetchFolderName = async () => {
      try {
        const res = await axios.get(`http://localhost:4000/api/folders`);
        const folder = res.data.find((f) => f._id === folderId);
        setFolderName(folder ? folder.name : "Folder Documents");
      } catch (err) {
        console.error("Error fetching folder name:", err);
      }
    };

    if (folderId) {
      fetchDocuments();
      fetchFolderName();
    }
  }, [folderId]);

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

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
      alert("Failed to delete file. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setDeleteDocId(null);
    }
  };

  return (
    <div className="folder-documents-page">
      {/* Fixed header with folder name */}
      <div className="folder-details-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="folder-title-container">
          <img
            src="/assets/folder-small-icon.png"
            alt="Folder Icon"
            className="folder-header-icon"
          />
          <h2 className="folder-title">{folderName}</h2>
        </div>
      </div>

      {documents.length === 0 ? (
        <p className="no-documents-text">No documents in this folder.</p>
      ) : (
        <table className="documents-table">
          <colgroup>
            <col style={{ width: "55%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr>
              <th>File Name</th>
              <th>Uploaded On</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => {
              const { date, time } = formatDateTime(doc.uploadDate);
              return (
                <tr key={doc._id}>
                  <td className="td-filename">
                    <span className="filename-text">{doc.filename}</span>
                  </td>
                  <td className="td-uploaded">
                    <div className="date">{date}</div>
                    <div className="time">{time}</div>
                  </td>
                  <td className="td-actions">
                    <div className="actions-container">
                      <button
                        className="action-button"
                        onClick={() =>
                          window.open(
                            `http://localhost:4000/api/documents/view/${doc._id}`,
                            "_blank"
                          )
                        }
                      >
                        <img
                          src="/assets/view-icon.png"
                          alt="View"
                          className="action-icon"
                        />
                      </button>
                      <button className="action-button">
                        <img
                          src="/assets/folder-small-icon.png"
                          alt="Move"
                          className="action-icon"
                        />
                      </button>
                      <button
                        className="action-button"
                        onClick={() => handleDeleteClick(doc._id)}
                      >
                        <img
                          src="/assets/delete-icon.png"
                          alt="Delete"
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
            <p>Are you sure you want to delete this file?</p>
            <div className="confirm-actions">
              <button
                className="confirm-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button className="confirm-delete" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
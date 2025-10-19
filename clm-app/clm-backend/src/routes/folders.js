// src/routes/folders.js
const express = require("express");
const { db, bucket } = require("../firestore"); // Firestore + GCS
const router = express.Router();

// Firestore collections
const foldersCollection = db.collection("folders");
const filesCollection = db.collection("files"); // metadata of uploaded files

// --- Get all folders with file count ---
router.get("/", async (req, res) => {
  try {
    const snapshot = await foldersCollection.orderBy("createdAt", "desc").get();
    const folders = [];

    for (const doc of snapshot.docs) {
      const folderData = doc.data();
      const folderId = doc.id;

      // Count files in this folder
      const filesSnapshot = await filesCollection
        .where("folderId", "==", folderId)
        .get();

      folders.push({
        id: folderId,
        name: folderData.name,
        createdAt: folderData.createdAt.toDate(),
        updatedAt: folderData.updatedAt?.toDate() || null,
        fileCount: filesSnapshot.size,
      });
    }

    res.json(folders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch folders" });
  }
});

// --- Create a new folder ---
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Folder name is required" });
    }

    const now = new Date();
    const docRef = await foldersCollection.add({
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json({
      id: docRef.id,
      name: name.trim(),
      createdAt: now,
      updatedAt: now,
      fileCount: 0,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

// --- Get all documents in a folder ---
router.get("/:folderId/documents", async (req, res) => {
  try {
    const { folderId } = req.params;

    // Query Firestore files with this folderId
    const snapshot = await filesCollection
      .where("folderId", "==", folderId)
      .orderBy("createdAt", "desc")
      .get();

    const files = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// --- Delete a folder by ID (only if empty) ---
router.delete("/:folderId", async (req, res) => {
  try {
    const { folderId } = req.params;

    // Check if folder has files
    const filesSnapshot = await filesCollection
      .where("folderId", "==", folderId)
      .get();

    if (!filesSnapshot.empty) {
      return res
        .status(400)
        .json({ error: "Cannot delete folder: it still contains files." });
    }

    // Delete folder
    const folderDoc = foldersCollection.doc(folderId);
    const folderSnapshot = await folderDoc.get();
    if (!folderSnapshot.exists) {
      return res.status(404).json({ error: "Folder not found" });
    }

    await folderDoc.delete();

    res.json({ message: "Folder deleted successfully", folderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
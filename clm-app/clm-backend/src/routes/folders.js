const express = require("express");
const Folder = require("../models/Folder");
const { getBucket } = require("../gridfs");
const { ObjectId } = require("mongodb");

const router = express.Router();

// --- Get all folders ---
router.get("/", async (req, res) => {
  try {
    const folders = await Folder.find().sort({ createdAt: -1 });
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

    const folder = new Folder({ name: name.trim() });
    await folder.save();
    res.status(201).json(folder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create folder" });
  }
});

// --- Get all documents in a folder ---
router.get("/:folderId/documents", async (req, res) => {
  try {
    const { folderId } = req.params;
    if (!ObjectId.isValid(folderId)) return res.status(400).send("Invalid folder ID");

    const bucket = getBucket();
    const files = await bucket
      .find({ "metadata.folderId": folderId })
      .sort({ uploadDate: -1 })
      .toArray();

    res.json({ files });
  } catch (err) {
    console.error("Error fetching folder documents:", err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
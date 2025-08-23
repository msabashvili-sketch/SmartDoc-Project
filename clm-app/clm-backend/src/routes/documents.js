// src/routes/documents.js
const express = require("express");
const router = express.Router();
const { upload, uploadFilesToGridFS } = require("../upload");
const { getBucket } = require("../gridfs");
const { ObjectId } = require("mongodb");

// Upload route
router.post("/upload", upload.array("files"), uploadFilesToGridFS);

// List all import files (not in repository)
router.get("/", async (req, res) => {
  try {
    const bucket = getBucket();
    const files = await bucket
      .find({ "metadata.repository": { $ne: true } })
      .sort({ uploadDate: -1 })
      .toArray();
    res.json({ files });
  } catch (err) {
    console.error("❌ Error fetching import files:", err);
    res.status(500).send("Error fetching files");
  }
});

// List all repository files
router.get("/repository", async (req, res) => {
  try {
    const bucket = getBucket();
    const files = await bucket
      .find({ "metadata.repository": true })
      .sort({ uploadDate: -1 })
      .toArray();
    res.json({ files });
  } catch (err) {
    console.error("❌ Error fetching repository files:", err);
    res.status(500).send("Error fetching files");
  }
});

// Stream file for viewing
router.get("/view/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) return res.status(400).send("Invalid file ID");

    const bucket = getBucket();
    const _id = new ObjectId(fileId);

    const files = await bucket.find({ _id }).toArray();
    if (!files || files.length === 0) return res.status(404).send("File not found");

    const file = files[0];
    const encodedFilename = encodeURIComponent(file.filename);

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${file.filename}"; filename*=UTF-8''${encodedFilename}`
    );
    res.setHeader("Content-Type", file.contentType || "application/pdf");

    const downloadStream = bucket.openDownloadStream(_id);
    downloadStream.on("error", err => {
      console.error("❌ Stream error:", err);
      res.status(500).send("Error streaming file");
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error("❌ Error fetching file:", err);
    res.status(500).send("Error fetching file");
  }
});

// --- Send selected files to repository ---
router.post("/send-to-repository", async (req, res) => {
  try {
    const { fileIds } = req.body;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ message: "No file IDs provided" });
    }

    const bucket = getBucket();
    const filesCollection = bucket.s.db.collection(`${bucket.s.options.bucketName}.files`);

    await Promise.all(
      fileIds.map(async (id) => {
        if (!ObjectId.isValid(id)) return;
        const _id = new ObjectId(id);

        // Mark file as repository
        await filesCollection.updateOne(
          { _id },
          { $set: { "metadata.repository": true } }
        );
      })
    );

    res.json({ message: "Files sent to repository successfully!" });
  } catch (err) {
    console.error("❌ Send to repository error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Delete selected files ---
router.post("/delete", async (req, res) => {
  try {
    const { fileIds } = req.body;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res.status(400).json({ message: "No file IDs provided" });
    }

    const bucket = getBucket();

    await Promise.all(
      fileIds.map(async (id) => {
        if (!ObjectId.isValid(id)) return;
        const _id = new ObjectId(id);
        try {
          await bucket.delete(_id);
        } catch (err) {
          console.error(`Failed to delete file ${id}:`, err);
        }
      })
    );

    res.json({ message: "Files deleted successfully!" });
  } catch (err) {
    console.error("❌ Delete files error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
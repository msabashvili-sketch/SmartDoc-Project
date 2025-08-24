// src/routes/documents.js
const express = require("express");
const router = express.Router();
const { upload, uploadAndParseFiles } = require("../uploadWithText");
const { getBucket } = require("../gridfs");
const { ObjectId } = require("mongodb");

// Upload route
router.post("/upload", upload.array("files"), uploadAndParseFiles);

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

// Stream file for viewing (PDFs and text)
router.get("/view/:id", async (req, res) => {
  try {
    const fileId = req.params.id;
    if (!ObjectId.isValid(fileId)) return res.status(400).send("Invalid file ID");

    const bucket = getBucket();
    const db = bucket.s.db;
    const _id = new ObjectId(fileId);

    // 1️⃣ Try to find in GridFS
    const files = await bucket.find({ _id }).toArray();
    if (files.length > 0) {
      const file = files[0];
      console.log("Serving PDF from GridFS:", file.filename);

      const encodedFilename = encodeURIComponent(file.filename);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${file.filename}"; filename*=UTF-8''${encodedFilename}`
      );
      res.setHeader("Content-Type", file.contentType || "application/pdf");

      const downloadStream = bucket.openDownloadStream(_id);
      downloadStream.on("error", (err) => {
        console.error("❌ Stream error:", err);
        res.status(500).send("Error streaming file");
      });

      return downloadStream.pipe(res);
    }

    // 2️⃣ If not found in GridFS, try TextDocuments collection
    const textCollection = db.collection("TextDocuments");
    const textDoc = await textCollection.findOne({ _id });
    if (!textDoc) {
      console.log("File not found in GridFS or TextDocuments:", fileId);
      return res.status(404).send("File not found");
    }

    console.log("Serving text document:", textDoc.filename);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${textDoc.filename}"; filename*=UTF-8''${encodeURIComponent(textDoc.filename)}`
    );
    res.setHeader("Content-Type", "text/plain");

    res.send(textDoc.text);
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
    const db = bucket.s.db;
    const textCollection = db.collection("TextDocuments");

    await Promise.all(
      fileIds.map(async (id) => {
        if (!ObjectId.isValid(id)) return;
        const _id = new ObjectId(id);

        try {
          // Delete from GridFS if exists
          await bucket.delete(_id);
        } catch (err) {
          console.log(`GridFS delete error for ${id}:`, err.message);
        }

        try {
          // Delete from TextDocuments collection if exists
          await textCollection.deleteOne({ _id });
        } catch (err) {
          console.log(`TextDocuments delete error for ${id}:`, err.message);
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
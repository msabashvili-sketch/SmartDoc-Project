// src/routes/documents.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { db, bucket } = require("../firestore"); // Firestore + GCS

// Firestore collections
const filesCollection = db.collection("files");

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// --- Upload files to GCS and metadata to Firestore ---
router.post("/upload", upload.array("files"), async (req, res) => {
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("Files:", req.files);

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  try {
    const uploadedFiles = [];

    for (const file of req.files) {
      const gcsFile = bucket.file(`${Date.now()}_${file.originalname}`);

      // Upload buffer to GCS
      await gcsFile.save(file.buffer, {
        contentType: file.mimetype,
        resumable: false,
      });

      // Save metadata to Firestore
      const docRef = await filesCollection.add({
        originalName: file.originalname,
        gcsPath: gcsFile.name,
        mimetype: file.mimetype,
        size: file.size,
        folderId: null,
        folderName: null,
        repository: false,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      uploadedFiles.push({
        id: docRef.id,
        originalName: file.originalname,
        gcsPath: gcsFile.name,
      });
    }

    res.json({ message: "Files uploaded successfully!", files: uploadedFiles });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Error uploading files" });
  }
});

// --- List files by filter ---
router.get("/", async (req, res) => {
  try {
    const snapshot = await filesCollection
      .where("repository", "==", false)
      .where("archived", "==", false)
      .orderBy("createdAt", "desc")
      .get();

    const files = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ files });
  } catch (err) {
    console.error("❌ Error fetching import files:", err);
    res.status(500).json({ message: "Error fetching files" });
  }
});

router.get("/repository", async (req, res) => {
  try {
    const snapshot = await filesCollection
      .where("repository", "==", true)
      .where("archived", "==", false)
      .orderBy("createdAt", "desc")
      .get();

    const files = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ files });
  } catch (err) {
    console.error("❌ Error fetching repository files:", err);
    res.status(500).json({ message: "Error fetching files" });
  }
});

router.get("/archive", async (req, res) => {
  try {
    const snapshot = await filesCollection
      .where("archived", "==", true)
      .orderBy("createdAt", "desc")
      .get();

    const files = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json({ files });
  } catch (err) {
    console.error("❌ Error fetching archive files:", err);
    res.status(500).json({ message: "Error fetching files" });
  }
});

// --- Download/stream file from GCS ---
router.get("/view/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await filesCollection.doc(id).get();

    if (!doc.exists) return res.status(404).send("File not found");

    const fileData = doc.data();
    const gcsFile = bucket.file(fileData.gcsPath);

    res.setHeader(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(fileData.originalName)}`
    );
    res.setHeader("Content-Type", fileData.mimetype || "application/octet-stream");

    const stream = gcsFile.createReadStream();
    stream.on("error", (err) => {
      console.error("❌ Stream error:", err);
      if (!res.headersSent) res.status(500).send("Error streaming file");
    });

    stream.pipe(res);
  } catch (err) {
    console.error("❌ Error fetching file:", err);
    res.status(500).send("Error fetching file");
  }
});

// --- Move files between repository/archive/folder ---
const updateFilesMetadata = async (fileIds, updateData) => {
  await Promise.all(
    fileIds.map(async (id) => {
      const docRef = filesCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return;
      await docRef.update({ ...updateData, updatedAt: new Date() });
    })
  );
};

router.post("/send-to-repository", async (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ message: "No files provided" });
  }
  try {
    await Promise.all(
      files.map(({ id, folderId, folderName }) =>
        filesCollection.doc(id).update({
          repository: true,
          archived: false,
          folderId: folderId || null,
          folderName: folderName || null,
          updatedAt: new Date(),
        })
      )
    );
    res.json({ message: "Files sent to repository successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/send-to-archive", async (req, res) => {
  const { fileIds } = req.body;
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ message: "No file IDs provided" });
  }
  try {
    await updateFilesMetadata(fileIds, { archived: true, repository: false });
    res.json({ message: "Files sent to archive successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/restore-from-archive", async (req, res) => {
  const { fileIds } = req.body;
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ message: "No file IDs provided" });
  }
  try {
    await updateFilesMetadata(fileIds, { archived: false, repository: true });
    res.json({ message: "Files restored from archive successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Delete files from GCS + Firestore ---
router.post("/delete", async (req, res) => {
  const { fileIds } = req.body;
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ message: "No file IDs provided" });
  }
  try {
    await Promise.all(
      fileIds.map(async (id) => {
        const docRef = filesCollection.doc(id);
        const doc = await docRef.get();
        if (!doc.exists) return;

        const fileData = doc.data();
        const gcsFile = bucket.file(fileData.gcsPath);

        try {
          await gcsFile.delete();
        } catch (err) {
          console.warn(`GCS delete error for ${fileData.gcsPath}:`, err.message);
        }

        await docRef.delete();
      })
    );
    res.json({ message: "Files deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Get documents by folder ---
router.get("/by-folder/:folderId", async (req, res) => {
  try {
    const { folderId } = req.params;
    const page = req.query.page || "repository";

    let query = filesCollection.where("folderId", "==", folderId);

    if (page === "repository") {
      query = query.where("repository", "==", true).where("archived", "==", false);
    } else if (page === "archive") {
      query = query.where("archived", "==", true);
    }

    // Fetch without orderBy first (to verify data shows)
    const snapshot = await query.get();

    const files = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ files });
  } catch (err) {
    console.error("🔥 Error fetching files by folder:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Move files to another folder (folder only) ---
router.post("/move-folder", async (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({ message: "No files provided" });
  }

  try {
    await Promise.all(
      files.map(({ id, folderId, folderName }) =>
        filesCollection.doc(id).update({ folderId: folderId || null, folderName: folderName || null, updatedAt: new Date() })
      )
    );
    res.json({ message: "Files moved to folder successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
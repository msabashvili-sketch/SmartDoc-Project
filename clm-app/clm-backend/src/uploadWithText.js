// src/uploadWithText.js
const multer = require("multer");
const { bucket, db } = require("./firestore");

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Main upload function
const uploadAndParseFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  try {
    const filesCollection = db.collection("files"); // Firestore collection for metadata
    const uploadedFiles = [];

    for (const file of req.files) {
      const normalizedFilename = file.originalname.normalize("NFC");
      const gcsFile = bucket.file(Date.now() + "_" + normalizedFilename);

      // Upload buffer to GCS
      await gcsFile.save(file.buffer, {
        contentType: file.mimetype,
        metadata: {
          originalName: normalizedFilename,
        },
        resumable: false,
      });

      // Save metadata in Firestore
      const now = new Date();
      const docRef = await filesCollection.add({
        folderId: null,
        folderName: null,
        filename: normalizedFilename,
        gcsPath: gcsFile.name,
        contentType: file.mimetype,
        repository: false,
        archived: false,
        createdAt: now,
        updatedAt: now,
      });

      uploadedFiles.push({
        id: docRef.id,
        filename: normalizedFilename,
        gcsPath: gcsFile.name,
      });
    }

    res.json({ message: "Files uploaded successfully!", files: uploadedFiles });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Error uploading files" });
  }
};

module.exports = { upload, uploadAndParseFiles };
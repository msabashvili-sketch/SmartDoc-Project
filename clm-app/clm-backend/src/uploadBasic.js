// src/uploadBasic.js
const multer = require("multer");
const { getBucket } = require("./gridfs");

const storage = multer.memoryStorage(); // keep in memory
const uploadBasic = multer({ storage }); // no file size limit

// Upload files to GridFS
const uploadFilesToGridFS = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const bucket = getBucket();
  const userId = req.user._id;

  try {
    const uploadedFiles = [];

    for (const file of req.files) {
      const filename = file.originalname.normalize("NFC");

      const uploadStream = bucket.openUploadStream(filename, {
        contentType: file.mimetype,
        metadata: {
          owners: [userId],
          sharedWith: [],
          repository: false,
          archived: false,
          folderId: null,
          folderName: null,
          importType: "basic", // mark as basic import
        },
      });

      await new Promise((resolve, reject) => {
        uploadStream.end(file.buffer);
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      uploadedFiles.push({
        _id: uploadStream.id,
        filename,
        mimetype: file.mimetype,
        size: file.size,
      });
    }

    res.status(201).json({
      message: "Files uploaded successfully!",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("❌ Basic Upload error:", err);
    res.status(500).json({ message: "Error uploading files", error: err.message });
  }
};

module.exports = { uploadBasic, uploadFilesToGridFS };
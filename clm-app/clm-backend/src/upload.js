const multer = require("multer");
const { getBucket } = require("./gridfs");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadFilesToGridFS = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  const bucket = getBucket();
  if (!bucket) return res.status(500).send("MongoDB not connected yet. Try again later.");

  try {
    const uploadedFiles = await Promise.all(
      req.files.map(file => {
        return new Promise((resolve, reject) => {
          // Keep original filename in metadata for React to display
          const utf8Filename = Buffer.from(file.originalname, "utf8").toString();

          const uploadStream = bucket.openUploadStream(utf8Filename, {
            contentType: file.mimetype,
            metadata: { filename: file.originalname } // ✅ store original name
          });

          uploadStream.end(file.buffer);

          uploadStream.on("finish", () => {
            resolve({
              id: uploadStream.id,
              filename: file.originalname, // original UTF-8 filename
              uploadDate: new Date(),
              metadata: { filename: file.originalname } // include for frontend
            });
          });

          uploadStream.on("error", reject);
        });
      })
    );

    res.json({
      message: "Files uploaded successfully!",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).send("Error uploading files");
  }
};

module.exports = { upload, uploadFilesToGridFS };
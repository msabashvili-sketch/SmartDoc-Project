// src/uploadSmart.js
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const { getBucket } = require("./gridfs");

const storage = multer.memoryStorage(); // memory storage, no size limits
const uploadSmart = multer({ storage });

// Convert buffer to PNG for OCR
async function bufferToPng(buffer) {
  try {
    return await sharp(buffer).png().toBuffer();
  } catch (err) {
    console.error("Sharp conversion failed:", err);
    return buffer;
  }
}

// Run OCR
async function runOCR(buffer) {
  try {
    const pngBuffer = await bufferToPng(buffer);
    const result = await Tesseract.recognize(pngBuffer, "eng+kat", {
      tessedit_pageseg_mode: 4,
    });
    return result.data.text.trim();
  } catch (err) {
    console.error("OCR failed:", err);
    return "";
  }
}

// Upload & parse files (PDF/image)
async function uploadAndParseFiles(req, res) {
  if (!req.files?.length) return res.status(400).json({ message: "No files uploaded" });
  if (!req.user?._id) return res.status(401).json({ message: "User not authenticated" });

  const bucket = getBucket();
  const db = bucket.s.db;
  const filesCollection = db.collection(`${bucket.s.options.bucketName}.files`);
  const textCollection = db.collection("TextDocuments");
  const userId = req.user._id;

  try {
    const uploadedFiles = [];

    for (const file of req.files) {
      let extractedText = "";

      if (file.mimetype === "application/pdf") {
        try {
          const pdfData = await pdfParse(file.buffer);
          extractedText = pdfData.text.trim();
        } catch (err) {
          console.warn("PDF parse failed, using OCR:", err);
          extractedText = await runOCR(file.buffer);
        }

        if (!extractedText || extractedText.length < 20) {
          extractedText = await runOCR(file.buffer);
        }
      } else if (file.mimetype.startsWith("image/")) {
        extractedText = await runOCR(file.buffer);
      }

      const normalizedFilename = file.originalname.normalize("NFC");

      const uploadStream = bucket.openUploadStream(normalizedFilename, {
        contentType: file.mimetype,
        metadata: {
          owners: [userId],
          sharedWith: [],
          repository: false,
          archived: false,
          folderId: null,
          folderName: null,
          importType: "smart", // mark as smart import
          size: file.size,
        },
      });

      await new Promise((resolve, reject) => {
        uploadStream.end(file.buffer);
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      const fileId = uploadStream.id;

      const textDoc = {
        fileId,
        filename: normalizedFilename.replace(/\.[^/.]+$/, "") + ".txt",
        text: extractedText,
        createdAt: new Date(),
      };

      const { insertedId: textId } = await textCollection.insertOne(textDoc);

      await filesCollection.updateOne(
        { _id: fileId },
        { $set: { "metadata.textDocId": textId, "metadata.textDocName": textDoc.filename } }
      );

      uploadedFiles.push({
        _id: fileId,
        textId,
        filename: normalizedFilename,
        textFilename: textDoc.filename,
      });
    }

    res.status(201).json({
      message: "✅ Smart import completed successfully!",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("❌ Upload and parse error:", err);
    res.status(500).json({ message: "Error uploading files", error: err.message });
  }
}

module.exports = { uploadSmart, uploadAndParseFiles };
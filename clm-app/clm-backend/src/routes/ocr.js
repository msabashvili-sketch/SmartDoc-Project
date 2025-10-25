// src/routes/ocr.js
const express = require("express");
const { DocumentProcessorServiceClient } = require("@google-cloud/documentai");
const multer = require("multer");
const fs = require("fs");

const router = express.Router();
const upload = multer({ dest: "uploads/" });

const projectId = process.env.GOOGLE_PROJECT_ID;
const location = process.env.GOOGLE_PROCESSOR_LOCATION;
const processorId = process.env.GOOGLE_PROCESSOR_ID;

const client = new DocumentProcessorServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

// POST /api/documents/ocr
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);

    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
    console.log(`Processing document with: ${name}`);

    const request = {
      name,
      rawDocument: {
        content: fileBuffer, // send Buffer directly
        mimeType: req.file.mimetype,
      },
    };

    const [result] = await client.processDocument(request);

    // Extract text
    const text = result.document?.text || "";

    fs.unlinkSync(filePath); // clean up
    res.json({ text });
  } catch (err) {
    console.error("❌ OCR error:", err);
    res.status(500).json({ error: "OCR processing failed", details: err.message });
  }
});

module.exports = router;
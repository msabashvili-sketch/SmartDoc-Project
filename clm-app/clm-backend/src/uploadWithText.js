// src/uploadWithText.js
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const { getBucket } = require("./gridfs");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Placeholder AI function
const generateAITags = async (text) => {
  console.log("Generating AI tags (placeholder)");
  return [];
};

// Convert buffer to PNG (normalize input)
async function bufferToPng(buffer) {
  try {
    return await sharp(buffer).png().toBuffer();
  } catch (err) {
    console.error("Sharp conversion failed:", err);
    return buffer;
  }
}

// OCR with Tesseract + multi-column support
const runOCR = async (buffer) => {
  console.log("Running OCR...");
  try {
    const pngBuffer = await bufferToPng(buffer);
    const image = sharp(pngBuffer);
    const metadata = await image.metadata();

    console.log("Image metadata:", metadata);

    // If image is wide → try splitting into 2 columns
    if (metadata.width > 1000 && metadata.height > 0) {
      console.log("Wide image detected → splitting into 2 columns...");

      const midX = Math.floor(metadata.width / 2);
      const leftWidth = Math.max(midX, 1);
      const rightWidth = Math.max(metadata.width - midX, 1);

      try {
        const leftBuffer = await image
          .extract({ left: 0, top: 0, width: leftWidth, height: metadata.height })
          .toBuffer();

        const rightBuffer = await image
          .extract({ left: midX, top: 0, width: rightWidth, height: metadata.height })
          .toBuffer();

        const leftResult = await Tesseract.recognize(leftBuffer, "eng+kat", {
          tessedit_pageseg_mode: 6,
        });
        const rightResult = await Tesseract.recognize(rightBuffer, "eng+kat", {
          tessedit_pageseg_mode: 6,
        });

        const combined =
          (leftResult.data.text || "").trim() + "\n\n" + (rightResult.data.text || "").trim();

        console.log("OCR (columns) length:", combined.length);
        return combined;
      } catch (splitErr) {
        console.error("Column split OCR failed, falling back:", splitErr);
        const result = await Tesseract.recognize(pngBuffer, "eng+kat", {
          tessedit_pageseg_mode: 4,
        });
        return result.data.text;
      }
    }

    // Single column OCR
    const result = await Tesseract.recognize(pngBuffer, "eng+kat", {
      tessedit_pageseg_mode: 4,
    });
    console.log("OCR (single column) length:", result.data.text.length);
    return result.data.text;
  } catch (err) {
    console.error("OCR failed:", err);
    return "";
  }
};

const uploadAndParseFiles = async (req, res) => {
  console.log("uploadAndParseFiles called");

  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  const bucket = getBucket();
  if (!bucket) return res.status(500).send("MongoDB not connected yet.");

  const db = bucket.s.db;
  const filesCollection = db.collection(`${bucket.s.options.bucketName}.files`);
  const textCollection = db.collection("TextDocuments");

  try {
    const uploadedFiles = [];

    for (const file of req.files) {
      console.log(`Processing: ${file.originalname}`);
      let extractedText = "";

      // PDF parsing
      if (file.mimetype === "application/pdf") {
        try {
          const pdfData = await pdfParse(file.buffer);
          extractedText = pdfData.text.trim();
          console.log(`Parsed PDF text length: ${extractedText.length}`);
        } catch (err) {
          console.error(`PDF parsing failed for ${file.originalname}:`, err);
        }

        if (!extractedText || extractedText.length < 20) {
          console.log("Fallback → OCR for scanned PDF...");
          extractedText = await runOCR(file.buffer);
        }
      }
      // Image files
      else if (file.mimetype.startsWith("image/")) {
        console.log("Image detected → running OCR...");
        extractedText = await runOCR(file.buffer);
      } else {
        console.log(`Unsupported file type: ${file.mimetype}`);
      }

      // Upload original file to GridFS
      const uploadStream = bucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
        metadata: { scannedDocName: file.originalname },
      });

      await new Promise((resolve, reject) => {
        uploadStream.end(file.buffer);
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      const fileId = uploadStream.id;
      console.log(`Uploaded file ID: ${fileId}`);

      // AI tags
      const aiTags = await generateAITags(extractedText);

      // Save OCR/text version
      const textDoc = {
        fileId,
        filename: file.originalname.replace(/\.[^/.]+$/, "") + ".txt",
        text: extractedText,
        aiTags,
        createdAt: new Date(),
      };

      const { insertedId: textId } = await textCollection.insertOne(textDoc);
      console.log(`Inserted text document ID: ${textId}`);

      // Update GridFS metadata
      await filesCollection.updateOne(
        { _id: fileId },
        {
          $set: {
            "metadata.scannedDocId": fileId,
            "metadata.scannedDocName": file.originalname,
            "metadata.textDocId": textId,
            "metadata.textDocName": textDoc.filename,
          },
        }
      );

      uploadedFiles.push({
        fileId,
        textId,
        filename: file.originalname,
        textFilename: textDoc.filename,
        aiTags,
      });
    }

    res.json({
      message: "Files uploaded and processed successfully!",
      files: uploadedFiles,
    });
  } catch (err) {
    console.error("Upload and parse error:", err);
    res.status(500).send("Error uploading files");
  }
};

module.exports = { upload, uploadAndParseFiles };
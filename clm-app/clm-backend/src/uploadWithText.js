const multer = require("multer");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const { getBucket } = require("./gridfs");

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Placeholder AI function
const generateAITags = async (text) => {
  console.log("Generating AI tags (placeholder)");
  return [];
};

// Convert buffer to PNG for OCR
async function bufferToPng(buffer) {
  try {
    return await sharp(buffer).png().toBuffer();
  } catch (err) {
    console.error("Sharp conversion failed:", err);
    return buffer;
  }
}

// OCR function
const runOCR = async (buffer) => {
  try {
    const pngBuffer = await bufferToPng(buffer);
    const image = sharp(pngBuffer);
    const metadata = await image.metadata();

    // Split wide images into columns
    if (metadata.width > 1000 && metadata.height > 0) {
      const midX = Math.floor(metadata.width / 2);
      const leftBuffer = await image.extract({ left: 0, top: 0, width: midX, height: metadata.height }).toBuffer();
      const rightBuffer = await image.extract({ left: midX, top: 0, width: metadata.width - midX, height: metadata.height }).toBuffer();

      const leftResult = await Tesseract.recognize(leftBuffer, "eng+kat", { tessedit_pageseg_mode: 6 });
      const rightResult = await Tesseract.recognize(rightBuffer, "eng+kat", { tessedit_pageseg_mode: 6 });

      return (leftResult.data.text || "").trim() + "\n\n" + (rightResult.data.text || "").trim();
    }

    // Single column OCR
    const result = await Tesseract.recognize(pngBuffer, "eng+kat", { tessedit_pageseg_mode: 4 });
    return result.data.text;
  } catch (err) {
    console.error("OCR failed:", err);
    return "";
  }
};

// Main upload & parse function
const uploadAndParseFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).send("No files uploaded");

  const isSmartImport = req.body.isSmartImport === "true"; // Read flag from frontend

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

      // Only run OCR if Smart Import
      if (isSmartImport) {
        if (file.mimetype === "application/pdf") {
          try {
            const pdfData = await pdfParse(file.buffer);
            extractedText = pdfData.text.trim();
          } catch (err) {
            console.error("PDF parsing failed:", err);
          }

          // Fallback to OCR for scanned PDFs
          if (!extractedText || extractedText.length < 20) {
            console.log("Fallback → OCR for scanned PDF...");
            extractedText = await runOCR(file.buffer);
          }
        } else if (file.mimetype.startsWith("image/")) {
          extractedText = await runOCR(file.buffer);
        } else {
          console.log(`Unsupported file type for OCR: ${file.mimetype}`);
        }
      }

      // Normalize filename
      const normalizedFilename = file.originalname.normalize("NFC");

      // Upload original file to GridFS
      const uploadStream = bucket.openUploadStream(normalizedFilename, {
        contentType: file.mimetype,
        metadata: { scannedDocName: normalizedFilename },
      });

      await new Promise((resolve, reject) => {
        uploadStream.end(file.buffer);
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      const fileId = uploadStream.id;

      // Generate AI tags if Smart Import
      const aiTags = isSmartImport ? await generateAITags(extractedText) : [];

      // Save OCR/text only if Smart Import
      let textId = null;
      let textFilename = null;
      if (isSmartImport) {
        const textDoc = {
          fileId,
          filename: normalizedFilename.replace(/\.[^/.]+$/, "") + ".txt",
          text: extractedText,
          aiTags,
          createdAt: new Date(),
        };
        const insertResult = await textCollection.insertOne(textDoc);
        textId = insertResult.insertedId;
        textFilename = textDoc.filename;
      }

      // Update GridFS metadata
      await filesCollection.updateOne(
        { _id: fileId },
        {
          $set: {
            "metadata.scannedDocId": fileId,
            "metadata.scannedDocName": normalizedFilename,
            "metadata.textDocId": textId,
            "metadata.textDocName": textFilename,
          },
        }
      );

      uploadedFiles.push({
        fileId,
        textId,
        filename: normalizedFilename,
        textFilename,
        aiTags,
      });
    }

    res.json({ message: "Files uploaded successfully!", files: uploadedFiles });
  } catch (err) {
    console.error("Upload and parse error:", err);
    res.status(500).send("Error uploading files");
  }
};

module.exports = { upload, uploadAndParseFiles };
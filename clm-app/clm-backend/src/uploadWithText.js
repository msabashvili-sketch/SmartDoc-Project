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

// Convert buffer to PNG
async function bufferToPng(buffer) {
  try {
    return await sharp(buffer).png().toBuffer();
  } catch (err) {
    console.error("Sharp conversion failed:", err);
    return buffer;
  }
}

// OCR with Tesseract
const runOCR = async (buffer) => {
  try {
    const pngBuffer = await bufferToPng(buffer);
    const image = sharp(pngBuffer);
    const metadata = await image.metadata();

    // If image is wide → split columns
    if (metadata.width > 1000 && metadata.height > 0) {
      const midX = Math.floor(metadata.width / 2);
      const leftWidth = Math.max(midX, 1);
      const rightWidth = Math.max(metadata.width - midX, 1);

      try {
        const leftBuffer = await image.extract({ left: 0, top: 0, width: leftWidth, height: metadata.height }).toBuffer();
        const rightBuffer = await image.extract({ left: midX, top: 0, width: rightWidth, height: metadata.height }).toBuffer();

        const leftResult = await Tesseract.recognize(leftBuffer, "eng+kat", { tessedit_pageseg_mode: 6 });
        const rightResult = await Tesseract.recognize(rightBuffer, "eng+kat", { tessedit_pageseg_mode: 6 });

        return (leftResult.data.text || "").trim() + "\n\n" + (rightResult.data.text || "").trim();
      } catch (splitErr) {
        console.error("Column split OCR failed, falling back:", splitErr);
        const result = await Tesseract.recognize(pngBuffer, "eng+kat", { tessedit_pageseg_mode: 4 });
        return result.data.text;
      }
    }

    // Single column OCR
    const result = await Tesseract.recognize(pngBuffer, "eng+kat", { tessedit_pageseg_mode: 4 });
    return result.data.text;
  } catch (err) {
    console.error("OCR failed:", err);
    return "";
  }
};

const uploadAndParseFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).send("No files uploaded");

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
        } catch (err) {
          console.error(`PDF parsing failed:`, err);
        }

        // OCR fallback for scanned PDFs or short text
        if (!extractedText || extractedText.length < 20) {
          console.log("Fallback → OCR for scanned PDF...");
          extractedText = await runOCR(file.buffer);
        }
      } 
      // Images
      else if (file.mimetype.startsWith("image/")) {
        extractedText = await runOCR(file.buffer);
      } 
      else {
        console.log(`Unsupported file type: ${file.mimetype}`);
      }

      // Normalize filename to NFC (Georgian characters safe)
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

      // Generate AI tags
      const aiTags = await generateAITags(extractedText);

      // Save OCR/text version
      const textDoc = {
        fileId,
        filename: normalizedFilename.replace(/\.[^/.]+$/, "") + ".txt",
        text: extractedText,
        aiTags,
        createdAt: new Date(),
      };

      const { insertedId: textId } = await textCollection.insertOne(textDoc);

      // Update GridFS metadata
      await filesCollection.updateOne(
        { _id: fileId },
        {
          $set: {
            "metadata.scannedDocId": fileId,
            "metadata.scannedDocName": normalizedFilename,
            "metadata.textDocId": textId,
            "metadata.textDocName": textDoc.filename,
          },
        }
      );

      uploadedFiles.push({
        fileId,
        textId,
        filename: normalizedFilename,
        textFilename: textDoc.filename,
        aiTags,
      });
    }

    res.json({ message: "Files uploaded and processed successfully!", files: uploadedFiles });
  } catch (err) {
    console.error("Upload and parse error:", err);
    res.status(500).send("Error uploading files");
  }
};

module.exports = { upload, uploadAndParseFiles };
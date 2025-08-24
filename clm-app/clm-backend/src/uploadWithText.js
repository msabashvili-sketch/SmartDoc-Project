const multer = require("multer");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const { getBucket } = require("./gridfs");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Placeholder AI function
const generateAITags = async (text) => {
  console.log("Generating AI tags (placeholder)");
  return [];
};

// OCR with Tesseract, supporting Georgian
const runOCR = async (buffer) => {
  console.log("Running OCR...");
  try {
    const { data: { text } } = await Tesseract.recognize(buffer, "eng+kat");
    console.log("OCR completed (first 100 chars):", text.substring(0, 100));
    return text;
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

      // PDF files
      if (file.mimetype === "application/pdf") {
        try {
          const pdfData = await pdfParse(file.buffer);
          extractedText = pdfData.text.trim();
          console.log(`Parsed PDF text length: ${extractedText.length}`);
        } catch (err) {
          console.error(`PDF parsing failed for ${file.originalname}:`, err);
        }

        if (!extractedText || extractedText.length < 20) {
          console.log("Fallback to OCR for scanned PDF...");
          extractedText = await runOCR(file.buffer);
        }
      }
      // Image files
      else if (file.mimetype.startsWith("image/")) {
        console.log("Image detected. Running OCR...");
        extractedText = await runOCR(file.buffer);
      } else {
        console.log(`Unsupported file type: ${file.mimetype}`);
      }

      // Upload original file to GridFS
      const uploadStream = bucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
        metadata: {
          scannedDocName: file.originalname,
        },
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

    res.json({ message: "Files uploaded and processed successfully!", files: uploadedFiles });
  } catch (err) {
    console.error("Upload and parse error:", err);
    res.status(500).send("Error uploading files");
  }
};

module.exports = { upload, uploadAndParseFiles };
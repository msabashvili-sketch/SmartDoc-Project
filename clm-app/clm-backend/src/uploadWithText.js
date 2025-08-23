// src/uploadWithText.js
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { getBucket } = require("./gridfs");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Placeholder AI function: replace with your AI logic
const generateAITags = async (text) => {
  // Example: return array of tags with text positions
  // [{ tag: "Payment Terms", start: 150, end: 300 }]
  return [];
};

const uploadAndParseFiles = async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded");
  }

  const bucket = getBucket();
  if (!bucket) return res.status(500).send("MongoDB not connected yet. Try again later.");

  try {
    const uploadedFiles = await Promise.all(
      req.files.map(async (file) => {
        // 1️⃣ Parse PDF text
        let pdfText = "";
        try {
          const pdfData = await pdfParse(file.buffer);
          pdfText = pdfData.text;
        } catch (err) {
          console.error(`Failed to parse PDF text for ${file.originalname}:`, err);
        }

        const filesCollection = bucket.db.collection(`${bucket.options.bucketName}.files`);

        // 2️⃣ Upload PDF file
        const utf8Filename = Buffer.from(file.originalname, "utf8").toString();
        const pdfUploadStream = bucket.openUploadStream(utf8Filename, {
          contentType: file.mimetype,
          metadata: {
            filename: file.originalname,
            scannedDocName: file.originalname,
            repository: false, // default: not in repository yet
          },
        });

        pdfUploadStream.end(file.buffer);
        await new Promise((resolve, reject) => {
          pdfUploadStream.on("finish", resolve);
          pdfUploadStream.on("error", reject);
        });

        // 3️⃣ Generate AI tags
        const aiTags = await generateAITags(pdfText);

        // 4️⃣ Upload text version as separate file
        const textFilename = file.originalname.replace(/\.[^/.]+$/, "") + ".txt";
        const textUploadStream = bucket.openUploadStream(textFilename, {
          contentType: "text/plain",
          metadata: {
            isTextVersion: true,            // ✅ flag for text file
            parentPdfId: pdfUploadStream.id, // ✅ link back to original PDF
            originalPdfName: file.originalname,
            aiTags,                          // ✅ AI tags
          },
        });
        textUploadStream.end(Buffer.from(pdfText, "utf-8"));
        await new Promise((resolve, reject) => {
          textUploadStream.on("finish", resolve);
          textUploadStream.on("error", reject);
        });

        // 5️⃣ Update PDF metadata to include textDocId
        await filesCollection.updateOne(
          { _id: pdfUploadStream.id },
          { $set: { textDocId: textUploadStream.id } }
        );

        return {
          pdfId: pdfUploadStream.id,
          textId: textUploadStream.id,
          filename: file.originalname,
          textFilename,
          uploadDate: new Date(),
          metadata: {
            filename: file.originalname,
            scannedDocId: pdfUploadStream.id,
            scannedDocName: file.originalname,
            textDocId: textUploadStream.id,
            textDocName: textFilename,
            aiTags,
          },
        };
      })
    );

    res.json({ message: "Files uploaded and parsed successfully!", files: uploadedFiles });
  } catch (err) {
    console.error("Upload and parse error:", err);
    res.status(500).send("Error uploading and parsing files");
  }
};

module.exports = { upload, uploadAndParseFiles };
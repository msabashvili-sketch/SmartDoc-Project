// src/uploadWithText.js
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { getBucket } = require("./gridfs");

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Placeholder AI function: replace with your AI logic
const generateAITags = async (text) => {
  console.log("Generating AI tags (placeholder)"); // 🔹 debug
  return [];
};

const uploadAndParseFiles = async (req, res) => {
  console.log("uploadAndParseFiles called"); // 🔹 confirm route is triggered

  if (!req.files || req.files.length === 0) {
    console.log("No files uploaded"); // 🔹
    return res.status(400).send("No files uploaded");
  }

  const bucket = getBucket();
  if (!bucket) return res.status(500).send("MongoDB not connected yet. Try again later.");

  const db = bucket.s.db; // access raw MongoDB db
  const filesCollection = db.collection(`${bucket.s.options.bucketName}.files`);
  const textCollection = db.collection("TextDocuments"); // separate collection for text files

  try {
    const uploadedFiles = [];

    for (const file of req.files) {
      console.log(`Processing file: ${file.originalname}`); // 🔹

      // 1️⃣ Parse PDF text
      let pdfText = "";
      try {
        const pdfData = await pdfParse(file.buffer);
        pdfText = pdfData.text;
        console.log(`Parsed text (first 100 chars):`, pdfText.substring(0, 100)); // 🔹
      } catch (err) {
        console.error(`Failed to parse PDF text for ${file.originalname}:`, err);
      }

      // 2️⃣ Upload PDF file into GridFS
      const pdfUploadStream = bucket.openUploadStream(file.originalname, {
        contentType: file.mimetype,
        metadata: {
          scannedDocName: file.originalname,
        },
      });

      await new Promise((resolve, reject) => {
        pdfUploadStream.end(file.buffer);
        pdfUploadStream.on("finish", resolve);
        pdfUploadStream.on("error", reject);
      });

      const pdfId = pdfUploadStream.id;
      console.log(`Uploaded PDF with ID: ${pdfId}`); // 🔹

      // 3️⃣ Generate AI tags
      const aiTags = await generateAITags(pdfText);

      // 4️⃣ Save text version in separate collection
      const textDoc = {
        pdfId,
        filename: file.originalname.replace(/\.[^/.]+$/, "") + ".txt",
        text: pdfText,
        aiTags,
        createdAt: new Date(),
      };

      const { insertedId: textId } = await textCollection.insertOne(textDoc);
      console.log(`Inserted text document with ID: ${textId}`); // 🔹

      // 5️⃣ Update PDF metadata to link text document
      await filesCollection.updateOne(
        { _id: pdfId },
        {
          $set: {
            "metadata.scannedDocId": pdfId,
            "metadata.scannedDocName": file.originalname,
            "metadata.textDocId": textId,
            "metadata.textDocName": textDoc.filename,
          },
        }
      );
      console.log(`Updated PDF metadata with textDocId: ${textId}`); // 🔹

      uploadedFiles.push({
        pdfId,
        textId,
        filename: file.originalname,
        textFilename: textDoc.filename,
        aiTags,
      });
    }

    console.log("All files processed:", uploadedFiles); // 🔹
    res.json({ message: "Files uploaded and parsed successfully!", files: uploadedFiles });
  } catch (err) {
    console.error("Upload and parse error:", err);
    res.status(500).send("Error uploading and parsing files");
  }
};

module.exports = { upload, uploadAndParseFiles };
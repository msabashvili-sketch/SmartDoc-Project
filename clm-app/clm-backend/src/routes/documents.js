// src/routes/documents.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { db, bucket } = require("../firestore");
const { DocumentProcessorServiceClient } = require("@google-cloud/documentai");

// Firestore collection
const filesCollection = db.collection("files");

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---- Document AI CONFIG ----
const projectId = process.env.GOOGLE_PROJECT_ID;
const location = process.env.GOOGLE_PROCESSOR_LOCATION;
const ocrProcessorId = process.env.GOOGLE_PROCESSOR_OCR;
const formProcessorId = process.env.GOOGLE_PROCESSOR_FORM;
const layoutProcessorId = process.env.GOOGLE_PROCESSOR_LAYOUT;

const client = new DocumentProcessorServiceClient({
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  apiEndpoint: `${location}-documentai.googleapis.com`,
});

// --- Helper: Process file with Document AI ---
async function processWithDocumentAI(fileBuffer, mimeType, processorId, fileName) {
  try {
    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
    console.log("📄 Processing file with Document AI:", fileName);
    console.log("🔗 Processor name:", name);

    const request = {
      name,
      rawDocument: {
        content: fileBuffer.toString("base64"),
        mimeType: mimeType || "application/pdf",
      },
    };

    const [result] = await client.processDocument(request);
    const text = result.document?.text || "";
    const entities = result.document?.entities || [];
    const pages = result.document?.pages || [];

    console.log(`✅ Processed ${fileName}: text ${text.length} chars, ${entities.length} entities, ${pages.length} pages`);
    return { text, entities, pages };
  } catch (err) {
    console.error(`❌ Document AI error for ${fileName}:`, err.message);
    if (err.details) console.error("Details:", err.details);
    return { text: null, entities: [], pages: [] };
  }
}

// --- Convert Document AI Layout blocks to renderable pages ---
function convertLayoutBlocksToPages(document) {
  if (!document) return [];

  let pages = document.pages || [];
  if (!pages.length && document.documentLayout?.blocks?.length) {
    const blocks = document.documentLayout.blocks;

    // Group all blocks into one pseudo-page
    pages = [
      {
        pageNumber: 1,
        paragraphs: blocks.map((b) => ({
          text: b.textBlock?.text || "",
          type: b.textBlock?.type || "paragraph",
          blockId: b.blockId,
          // Preserve styles
          style: {
            fontSize: b.textBlock?.layout?.textStyle?.fontSize?.size || null,
            fontWeight: b.textBlock?.layout?.textStyle?.fontWeight || "normal",
            fontStyle: b.textBlock?.layout?.textStyle?.fontStyle || "normal",
            textDecoration: b.textBlock?.layout?.textStyle?.textDecoration || "none",
            color: b.textBlock?.layout?.textStyle?.color?.rgbColor || null,
            bold: b.textBlock?.layout?.textStyle?.fontWeight === "bold",
            italic: b.textBlock?.layout?.textStyle?.fontStyle === "italic",
            alignment: b.textBlock?.layout?.textAnchor?.layout?.alignment || "left",
            lineHeight: b.textBlock?.layout?.textStyle?.lineHeight || null,
          },
          boundingBox: b.textBlock?.layout?.boundingPoly || null,
        })),
      },
    ];
  }
  return pages;
}

// --- Upload files (standard or smart) ---
router.post("/upload", upload.array("files"), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded" });
  }

  const isSmart = req.body.isSmartImport === "true";
  console.log("💡 isSmartImport flag:", req.body.isSmartImport, "=>", isSmart);

  const uploadedFiles = [];

  try {
    await Promise.all(
      req.files.map(async (file) => {
        console.log("📥 Uploading file:", file.originalname, "size:", file.size);

        const gcsFileName = `${Date.now()}_${file.originalname}`;
        const gcsFile = bucket.file(gcsFileName);

        // Upload to GCS
        await gcsFile.save(file.buffer, { contentType: file.mimetype, resumable: false });
        console.log("☁️ File uploaded to GCS:", gcsFileName);

        let ocrText = null;
        let formEntities = [];
        let layoutPages = [];

        if (isSmart) {
          // --- OCR ---
          console.log("🧠 Running OCR processor for file:", file.originalname);
          const ocrResult = await processWithDocumentAI(file.buffer, file.mimetype, ocrProcessorId, file.originalname);
          ocrText = ocrResult.text;

          // --- Form Parser ---
          console.log("🧠 Running Form parser for file:", file.originalname);
          const formResult = await processWithDocumentAI(file.buffer, file.mimetype, formProcessorId, file.originalname);
          formEntities = formResult.entities;

          // --- Layout Parser ---
          console.log("🧠 Running Layout parser for file:", file.originalname);
          try {
            console.log("🔹 Running Layout Parser (detailed mode)...");
            const [layoutResponse] = await client.processDocument({
              name: `projects/${projectId}/locations/${location}/processors/${layoutProcessorId}`,
              rawDocument: { content: file.buffer.toString("base64"), mimeType: file.mimetype },
            });

            console.log("✅ Layout Parser finished");
            layoutPages = convertLayoutBlocksToPages(layoutResponse.document);

            console.log(`📑 Layout Parser extracted ${layoutPages.length} pages`);
          } catch (err) {
            console.error("❌ Layout Parser error:", err.message);
            layoutPages = [];
          }

          console.log(`📝 OCR text length: ${ocrText?.length}, Form entities: ${formEntities.length}, Layout pages: ${layoutPages.length}`);
        } else {
          console.log("❌ Smart processors skipped for this file");
        }

        // --- Save to Firestore ---
        const docData = {
          originalName: file.originalname,
          gcsPath: gcsFileName,
          mimetype: file.mimetype,
          size: file.size,
          folderId: null,
          folderName: null,
          repository: false,
          archived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          textDoc: ocrText,
          formEntities,
          layoutPages,
        };

        console.log("💾 Saving file metadata to Firestore:", {
          originalName: docData.originalName,
          gcsPath: docData.gcsPath,
          textDocLength: ocrText?.length || 0,
          formEntitiesCount: formEntities.length,
          layoutPagesCount: layoutPages.length,
        });

        const docRef = await filesCollection.add(docData);

        uploadedFiles.push({
          id: docRef.id,
          originalName: file.originalname,
          gcsPath: gcsFileName,
          ocrText,
          formEntities,
          layoutPages,
        });
      })
    );

    console.log("✅ All files uploaded successfully");
    res.json({ message: "Files uploaded successfully!", files: uploadedFiles });
  } catch (err) {
    console.error("❌ Upload error:", err);
    res.status(500).json({ message: "Error uploading files" });
  }
});

// --- Other routes remain unchanged ---
router.get("/", async (req, res) => {
  try {
    const snapshot = await filesCollection.where("repository", "==", false).where("archived", "==", false).orderBy("createdAt", "desc").get();
    res.json({ files: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching files" });
  }
});

router.get("/repository", async (req, res) => {
  try {
    const snapshot = await filesCollection.where("repository", "==", true).where("archived", "==", false).orderBy("createdAt", "desc").get();
    res.json({ files: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching repository files" });
  }
});

router.get("/archive", async (req, res) => {
  try {
    const snapshot = await filesCollection.where("archived", "==", true).orderBy("createdAt", "desc").get();
    res.json({ files: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching archive files" });
  }
});

router.get("/view/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await filesCollection.doc(id).get();
    if (!doc.exists) return res.status(404).send("File not found");

    const fileData = doc.data();
    const gcsFile = bucket.file(fileData.gcsPath);
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(fileData.originalName)}`);
    res.setHeader("Content-Type", fileData.mimetype || "application/octet-stream");

    gcsFile.createReadStream().on("error", (err) => {
      console.error("❌ Stream error:", err);
      if (!res.headersSent) res.status(500).send("Error streaming file");
    }).pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching file");
  }
});

router.get("/text/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await filesCollection.doc(id).get();
    if (!doc.exists) return res.status(404).json({ message: "File not found" });

    const fileData = doc.data();
    res.json({
      id: doc.id,
      text: fileData.textDoc || "",
      formEntities: fileData.formEntities || [],
      layoutPages: fileData.layoutPages || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching document text" });
  }
});

// --- Metadata update helpers and archive/repository routes remain unchanged ---
const updateFilesMetadata = async (fileIds, updateData) => {
  await Promise.all(fileIds.map(async (id) => {
    const docRef = filesCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return;
    await docRef.update({ ...updateData, updatedAt: new Date() });
  }));
};

router.post("/send-to-repository", async (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) return res.status(400).json({ message: "No files provided" });

  try {
    await Promise.all(files.map(({ id, folderId, folderName }) => filesCollection.doc(id).update({
      repository: true,
      archived: false,
      folderId: folderId || null,
      folderName: folderName || null,
      updatedAt: new Date(),
    })));
    res.json({ message: "Files sent to repository successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/send-to-archive", async (req, res) => {
  const { fileIds } = req.body;
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) return res.status(400).json({ message: "No file IDs provided" });
  try { await updateFilesMetadata(fileIds, { archived: true, repository: false }); res.json({ message: "Files sent to archive successfully!" }); }
  catch (err) { console.error(err); res.status(500).json({ message: "Server error" }); }
});

router.post("/restore-from-archive", async (req, res) => {
  const { fileIds } = req.body;
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) return res.status(400).json({ message: "No file IDs provided" });
  try { await updateFilesMetadata(fileIds, { archived: false, repository: true }); res.json({ message: "Files restored from archive successfully!" }); }
  catch (err) { console.error(err); res.status(500).json({ message: "Server error" }); }
});

router.post("/delete", async (req, res) => {
  const { fileIds } = req.body;
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) return res.status(400).json({ message: "No file IDs provided" });

  try {
    await Promise.all(fileIds.map(async (id) => {
      const docRef = filesCollection.doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return;

      const fileData = doc.data();
      const gcsFile = bucket.file(fileData.gcsPath);
      try { await gcsFile.delete(); } catch (err) { console.warn(err.message); }
      await docRef.delete();
    }));
    res.json({ message: "Files deleted successfully!" });
  } catch (err) { console.error(err); res.status(500).json({ message: "Server error" }); }
});

router.get("/by-folder/:folderId", async (req, res) => {
  try {
    const { folderId } = req.params;
    const page = req.query.page || "repository";

    let query = filesCollection.where("folderId", "==", folderId);
    if (page === "repository") query = query.where("repository", "==", true).where("archived", "==", false);
    else if (page === "archive") query = query.where("archived", "==", true);

    const snapshot = await query.get();
    res.json({ files: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (err) { console.error(err); res.status(500).json({ message: "Server error" }); }
});

router.post("/move-folder", async (req, res) => {
  const { files } = req.body;
  if (!files || !Array.isArray(files) || files.length === 0) return res.status(400).json({ message: "No files provided" });

  try {
    await Promise.all(files.map(({ id, folderId, folderName }) => filesCollection.doc(id).update({
      folderId: folderId || null,
      folderName: folderName || null,
      updatedAt: new Date(),
    })));
    res.json({ message: "Files moved to folder successfully!" });
  } catch (err) { console.error(err); res.status(500).json({ message: "Server error" }); }
});

module.exports = router;
const fs = require("fs");
const path = require("path");
const { DocumentProcessorServiceClient } = require("@google-cloud/documentai");

// --- Config ---
const projectId = "smartdoc-project-474917";
const location = "eu";
const processorId = "71e7db843d8f143f";
const keyFile = path.join(__dirname, "src/keys/service-account-new.json");
const filePath = path.join(__dirname, "sample.pdf");

// --- Init client (force EU endpoint) ---
const client = new DocumentProcessorServiceClient({
  keyFilename: keyFile,
  apiEndpoint: `${location}-documentai.googleapis.com`,
});

async function runOCR() {
  try {
    if (!fs.existsSync(filePath)) throw new Error("❌ File not found: " + filePath);

    const fileBuffer = fs.readFileSync(filePath);
    console.log("📄 File size:", fileBuffer.length);

    const name = `projects/${projectId}/locations/${location}/processors/${processorId}`;
    console.log("🔍 Using processor:", name);

    const request = {
      name,
      rawDocument: {
        content: fileBuffer.toString("base64"),
        mimeType: "application/pdf",
      },
    };

    console.log("➡️ Sending request to Document AI...");
    const [result] = await client.processDocument(request);

    const text = result.document?.text || "";
    console.log("✅ ---- OCR Result ----");
    console.log(text);
  } catch (err) {
    console.error("❌ OCR Test Error:", err.message);
    if (err?.code === 3) console.error("⚠️ INVALID_ARGUMENT — likely endpoint or file encoding issue.");
  }
}

runOCR();
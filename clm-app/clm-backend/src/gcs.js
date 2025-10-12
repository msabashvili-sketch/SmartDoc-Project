// src/gcs.js
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const fs = require("fs");

// 1️⃣ Initialize Google Cloud Storage
// Make sure you set GOOGLE_APPLICATION_CREDENTIALS env variable to your JSON key
const storage = new Storage();
const BUCKET_NAME = "YOUR_BUCKET_NAME"; // <-- replace with your bucket name
const bucket = storage.bucket(BUCKET_NAME);

// 2️⃣ Upload file to bucket
async function uploadFile(filePath, destinationFileName) {
  try {
    const options = {
      destination: destinationFileName,
      resumable: true,
      metadata: {
        cacheControl: "no-cache",
      },
    };

    await bucket.upload(filePath, options);

    // Return public URL (optional, depends on your bucket permissions)
    const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${encodeURIComponent(destinationFileName)}`;
    console.log(`✅ File uploaded to ${publicUrl}`);
    return publicUrl;
  } catch (err) {
    console.error("❌ Error uploading to GCS:", err);
    throw err;
  }
}

// 3️⃣ Optional: Upload buffer instead of file path (useful for temp files)
async function uploadBuffer(buffer, destinationFileName, contentType = "application/octet-stream") {
  try {
    const file = bucket.file(destinationFileName);
    const stream = file.createWriteStream({
      resumable: true,
      metadata: { contentType },
    });

    return new Promise((resolve, reject) => {
      stream.on("finish", async () => {
        const publicUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${encodeURIComponent(destinationFileName)}`;
        console.log(`✅ Buffer uploaded to ${publicUrl}`);
        resolve(publicUrl);
      });

      stream.on("error", (err) => {
        console.error("❌ Error uploading buffer:", err);
        reject(err);
      });

      stream.end(buffer);
    });
  } catch (err) {
    console.error("❌ uploadBuffer error:", err);
    throw err;
  }
}

module.exports = {
  bucket,
  uploadFile,
  uploadBuffer,
};
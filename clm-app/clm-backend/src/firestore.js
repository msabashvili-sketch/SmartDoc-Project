// src/firestore.js
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

console.log("🔹 Initializing Firebase Admin SDK...");

// Path to service account
const serviceAccountPath = path.resolve("src/keys/service-account-new.json");
console.log("🔹 Using service account file:", serviceAccountPath);

// Load service account JSON
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "smartdoc-project-474917", // explicitly set
    storageBucket: "smartdocprojectdata-777", // GCS bucket
  });
}

const firestore = admin.firestore();
firestore.settings({
  ignoreUndefinedProperties: true,
  databaseId: "smartdocproject", // important to fix Firestore database ID
});

const bucket = admin.storage().bucket();

console.log("📁 Firebase Project ID:", serviceAccount.project_id);

// Optional: test Firestore & GCS connections
(async () => {
  try {
    console.log("⏳ Testing Firestore connection...");
    const testRef = firestore.collection("connection_test").doc("ping");
    await testRef.set({ timestamp: new Date().toISOString() });
    const doc = await testRef.get();
    if (doc.exists) {
      console.log("✅ Firestore write/read test successful");
    }

    console.log("⏳ Testing GCS bucket connection...");
    await bucket.getMetadata(); // just check if bucket exists
    console.log("✅ Connected to GCS bucket:", bucket.name);

    console.log("🔸 Firebase initialization complete.");
  } catch (error) {
    console.error("❌ Firestore/GCS test failed:", error.message);
  }
})();

module.exports = { db: firestore, bucket };
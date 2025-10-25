const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

console.log("🔹 Initializing Firebase Admin SDK...");

// Path to service account relative to this file
const serviceAccountPath = path.join(__dirname, "keys/service-account-new.json");
console.log("🔹 Using service account file:", serviceAccountPath);

// Load service account JSON
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "smartdoc-project-474917",
    storageBucket: "smartdocprojectdata-777",
  });
}

const firestore = admin.firestore();
firestore.settings({
  ignoreUndefinedProperties: true,
  databaseId: "smartdocproject",
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
    await bucket.getMetadata();
    console.log("✅ Connected to GCS bucket:", bucket.name);

    console.log("🔸 Firebase initialization complete.");
  } catch (error) {
    console.error("❌ Firestore/GCS test failed:", error.message);
  }
})();

module.exports = { db: firestore, bucket };
import admin from "firebase-admin";
import { readFileSync } from "fs";
import path from "path";

// ---------------------------
// 🔹 FIREBASE ADMIN SETUP
// ---------------------------
console.log("🔹 Initializing Firebase Admin SDK...");

const serviceAccountPath = path.resolve("src/keys/service-account-new.json");
console.log("🔹 Using service account file:", serviceAccountPath);

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "smartdoc-project-474917", // ✅ explicitly set
    storageBucket: "smartdocprojectdata-777",
  });
}

const firestore = admin.firestore();
firestore.settings({
  ignoreUndefinedProperties: true,
  databaseId: "smartdocproject", // ✅ important fix
});

const bucket = admin.storage().bucket();

console.log("📁 Firebase Project ID:", serviceAccount.project_id);

// ---------------------------
// 🔹 TEST FIRESTORE CONNECTION
// ---------------------------
(async () => {
  try {
    console.log("⏳ Testing Firestore connection...");

    const testRef = firestore.collection("connection_test").doc("ping");
    await testRef.set({ timestamp: new Date().toISOString() });

    const doc = await testRef.get();

    if (doc.exists) {
      console.log("✅ Firestore write/read test successful:", doc.data());
    } else {
      console.error("❌ Firestore test document not found!");
    }

    // ---------------------------
    // 🔹 TEST STORAGE CONNECTION
    // ---------------------------
    console.log("⏳ Testing GCS bucket connection...");

    const [files] = await bucket.getFiles({ maxResults: 1 });
    console.log("✅ Connected to GCS bucket:", bucket.name);
    console.log("📂 Found", files.length, "files (showing 1 if available):", files[0]?.name || "none");

    console.log("🔸 Firebase initialization complete.");
  } catch (error) {
    console.error("❌ Firestore test failed:", error.message);
  }
})();
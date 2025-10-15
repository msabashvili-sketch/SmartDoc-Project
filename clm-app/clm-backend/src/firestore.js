// src/firestore.js
const { Firestore } = require("@google-cloud/firestore");

// Initialize Firestore
const firestore = new Firestore({
  projectId: process.env.GCLOUD_PROJECT_ID,
  keyFilename: process.env.GCLOUD_KEY_FILE, // path to your service account JSON
});

// Firestore collection
const COLLECTION_NAME = "documents";

/**
 * Save a document to Firestore.
 * - If scannedDocId exists, update the document.
 * - If not, create a new document with a unique Firestore ID.
 */
async function saveDocument(doc) {
  try {
    // Use existing scannedDocId or generate a new Firestore doc ID
    const docRef = doc.scannedDocId
      ? firestore.collection(COLLECTION_NAME).doc(doc.scannedDocId)
      : firestore.collection(COLLECTION_NAME).doc(); // Auto-generated unique ID

    // Always store the ID inside the document for frontend reference
    const data = {
      ...doc,
      scannedDocId: docRef.id, // Frontend can use this to identify the file
      createdAt: doc.createdAt || new Date().toISOString(),
    };

    await docRef.set(data, { merge: true }); // Merge ensures update if ID exists
    console.log("✅ Firestore saveDocument successful:", data.filename);

    return data; // Return the saved document with scannedDocId
  } catch (err) {
    console.error("❌ Firestore saveDocument error:", err);
    throw err;
  }
}

/**
 * Get all documents from Firestore
 */
async function getAllDocuments() {
  try {
    const snapshot = await firestore.collection(COLLECTION_NAME).get();
    const docs = snapshot.docs.map(d => d.data());
    return docs;
  } catch (err) {
    console.error("❌ Firestore getAllDocuments error:", err);
    return [];
  }
}

/**
 * Optional: get document by ID
 */
async function getDocumentById(id) {
  try {
    const docRef = firestore.collection(COLLECTION_NAME).doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (err) {
    console.error("❌ Firestore getDocumentById error:", err);
    return null;
  }
}

module.exports = {
  firestore,
  saveDocument,
  getAllDocuments,
  getDocumentById,
};
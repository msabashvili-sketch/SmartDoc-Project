// src/testFirestore.js
require("dotenv").config();
const { Firestore } = require("@google-cloud/firestore");

// Initialize Firestore
const firestore = new Firestore({
  projectId: process.env.GOOGLE_PROJECT_ID,          // Your project ID
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS, // Path to service account JSON
  databaseId: "smartdocproject",                    // Explicitly set your database ID
});

async function testFirestore() {
  try {
    const docRef = firestore.collection("testCollection").doc(); // Test collection
    const data = {
      testField: "Hello Firestore!",
      timestamp: new Date(),
    };

    await docRef.set(data);
    console.log(`✅ Document saved successfully with ID: ${docRef.id}`);
  } catch (error) {
    console.error("❌ Firestore write failed:", error);
  }
}

testFirestore();
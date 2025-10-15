// testFirestoreWrite.js
const { Firestore } = require("@google-cloud/firestore");
require("dotenv").config();

(async () => {
  try {
    const firestore = new Firestore({
      projectId: process.env.GOOGLE_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      databaseId: "smartdocproject" , // ✅ Important
    });

    const collection = firestore.collection("documents");

    const result = await collection.add({
      test: true,
      timestamp: new Date(),
    });

    console.log("✅ Firestore write succeeded with ID:", result.id);
  } catch (error) {
    console.error("❌ Firestore test failed:", error);
  }
})();
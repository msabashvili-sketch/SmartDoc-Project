require("dotenv").config();
const { bucket } = require("./src/gcs"); // path points to your gcs.js

bucket.exists()
  .then((exists) => console.log("Bucket exists:", exists[0]))
  .catch((err) => console.error("Error checking bucket existence:", err));
// testUploadBuffer.js
require("dotenv").config();
const { uploadBuffer } = require("./src/gcs");

const testBuffer = Buffer.from("Hello GCS!"); // sample content
const destination = "test-folder/hello.txt";

uploadBuffer(testBuffer, destination, "text/plain")
  .then((url) => console.log("Uploaded successfully:", url))
  .catch((err) => console.error("Upload failed:", err));
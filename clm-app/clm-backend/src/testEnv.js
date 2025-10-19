const path = require("path");

// Bypass any global dotenvx interference by using the full path
require("dotenv").config({ path: path.resolve(__dirname, "../.env"), override: true });

console.log("GCS_BUCKET_NAME:", process.env.GCS_BUCKET_NAME);
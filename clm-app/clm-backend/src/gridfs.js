const { MongoClient, GridFSBucket } = require("mongodb");
require("dotenv").config();


let bucket;
let db;


const client = new MongoClient(process.env.MONGO_URI);


const initGridFS = async () => {
 if (bucket) return bucket; // already initialized


 await client.connect();
 db = client.db("test"); // your DB name
 bucket = new GridFSBucket(db, { bucketName: "documents" });
 console.log("✅ GridFS Bucket ready");
 return bucket;
};


const getBucket = () => {
 if (!bucket) throw new Error("GridFSBucket not initialized yet");
 return bucket;
};


module.exports = { initGridFS, getBucket };


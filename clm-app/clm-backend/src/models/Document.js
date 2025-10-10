// models/Document.js
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    path: { type: String }, // file path if stored on disk
    mimetype: { type: String },
    size: { type: Number },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",   // ✅ links to User
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Document", documentSchema);
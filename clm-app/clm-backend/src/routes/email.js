// src/routes/email.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const { getBucket } = require("../gridfs");

// POST /api/send-docs
router.post("/send-docs", async (req, res) => {
  try {
    const { recipients, subject, message, fileIds } = req.body;

    // Validate recipients
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No recipients provided" });
    }

    // Validate file IDs
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No files provided" });
    }

    const bucket = getBucket();
    const attachments = [];

    // Fetch files from GridFS
    for (const id of fileIds) {
      let _id;
      try {
        _id = new mongoose.Types.ObjectId(id);
      } catch (e) {
        console.warn(`Invalid ObjectId: ${id}, skipping`);
        continue;
      }

      const files = await bucket.find({ _id }).toArray();
      if (!files || files.length === 0) {
        console.warn(`File not found in GridFS: ${id}`);
        continue;
      }

      const file = files[0];
      const downloadStream = bucket.openDownloadStream(_id);
      const chunks = [];

      await new Promise((resolve, reject) => {
        downloadStream.on("data", (chunk) => chunks.push(chunk));
        downloadStream.on("error", reject);
        downloadStream.on("end", resolve);
      });

      const fileBuffer = Buffer.concat(chunks);
      if (fileBuffer.length === 0) {
        console.warn(`File is empty: ${file.filename}`);
        continue;
      }

      attachments.push({
        filename: file.filename,
        content: fileBuffer,
      });
    }

    if (attachments.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No valid files to send" });
    }

    // Log email details
    console.log("Recipients:", recipients);
    console.log("Subject:", subject);
    console.log("Attachments:", attachments.map((a) => a.filename));

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // App Password
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipients,
      subject: subject || "Documents from CLM",
      text: message || "",
      attachments,
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: err.message || err.toString(),
    });
  }
});

module.exports = router;
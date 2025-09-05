// src/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/documents");
const { initGridFS } = require("./gridfs");
const connectDB = require("./db"); 

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

// Health check
app.get("/", (req, res) => res.send("Backend API is running 🚀"));

// Start server after DB connection
async function startServer() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();  // <-- make sure this resolves
    console.log("MongoDB connected");

    console.log("Initializing GridFS...");
    await initGridFS(); // <-- optional, but after DB connection
    console.log("GridFS initialized");


    
const nodemailer = require("nodemailer");
const multer = require("multer");
const upload = multer(); // for multipart/form-data

// Email sending route
app.post("/api/send-email", upload.array("files"), async (req, res) => {
  try {
    const { recipients, subject, message, sendContract, sendSummary } = req.body;
    const files = req.files; // optional if sending uploaded files
    // If files come from GridFS, you would fetch them here instead

    if (!recipients || recipients.length === 0) {
      return res.status(400).json({ success: false, message: "No recipients provided" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Prepare attachments based on checkboxes
    const attachments = [];
    if (files) {
      files.forEach(file => {
        // Example filter based on name or type
        if ((sendContract && file.originalname.includes("contract")) ||
            (sendSummary && file.originalname.includes("summary"))) {
          attachments.push({
            filename: file.originalname,
            content: file.buffer,
          });
        }
      });
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipients,
      subject,
      text: message,
      attachments,
    });

    res.json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

startServer();
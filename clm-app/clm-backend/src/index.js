// src/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const documentRoutes = require("./routes/documents");
const emailRoutes = require("./routes/email");
const foldersRoutes = require("./routes/folders"); // ✅ add this
const { initGridFS } = require("./gridfs");
const connectDB = require("./db");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/folders", foldersRoutes); // ✅ attach folders routes
app.use("/api", emailRoutes);

// Health check
app.get("/", (req, res) => res.send("Backend API is running 🚀"));

// Start server after DB connection
async function startServer() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDB();
    console.log("MongoDB connected");

    console.log("Initializing GridFS...");
    await initGridFS();
    console.log("GridFS initialized");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
  }
}

startServer();
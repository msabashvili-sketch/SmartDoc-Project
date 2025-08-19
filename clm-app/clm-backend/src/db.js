const mongoose = require("mongoose");

const connectDB = async () => {
  mongoose.connection.on("connected", () => console.log("Mongoose connected"));
  mongoose.connection.on("error", (err) => console.error("Mongoose connection error:", err));
  mongoose.connection.on("disconnected", () => console.log("Mongoose disconnected"));

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      dbName: "test",
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connectDB finished ✅");
  } catch (err) {
    console.error("MongoDB connection failed:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
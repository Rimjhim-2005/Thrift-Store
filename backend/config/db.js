const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    
    if (!uri) {
      console.log("⚠️  No MONGO_URI provided. Using mock mode.");
      return;
    }

    await mongoose.connect(uri);
    console.log("✓ MongoDB Connected");
  } catch (error) {
    console.error("⚠️  MongoDB Connection Error:", error.message);
    console.log("ℹ️  Continuing in mock mode without database persistence.");
    // Don't exit - allow mock mode
  }
};

module.exports = connectDB;

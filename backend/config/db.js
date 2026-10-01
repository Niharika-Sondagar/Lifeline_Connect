const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const localUri = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/lifeline_connect";

  // Configure public DNS servers to resolve MongoDB SRV records reliably on Windows
  if (primaryUri && primaryUri.startsWith("mongodb+srv://")) {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    } catch (e) {
      // DNS setServers fallback
    }
  }

  // Attempt primary database connection
  if (primaryUri) {
    try {
      await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log("MongoDB connected successfully to primary database");
      return;
    } catch (error) {
      console.warn("Primary MongoDB connection failed (" + error.message + ")");
      console.log("Attempting fallback to local MongoDB (" + localUri + ")...");
    }
  }

  // Fallback to local MongoDB
  try {
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected successfully to local database (" + localUri + ")");
  } catch (error) {
    console.error("MongoDB local connection also failed:", error.message);
    console.error("Please ensure MongoDB is running or add your IP to the MongoDB Atlas whitelist.");
  }
};

module.exports = connectDB;

const mongoose = require("mongoose");// a library our Node.js backemnd usus to connect with MONGODB
const dns = require("dns");
// dns - Domain name resoultion library 
//So this part is mainly there to help with MongoDB Atlas SRV/DNS resolution issues on Windows.

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI; // gets connection string from environment variable, if not found it will be undefined
  const localUri = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/lifeline_connect";
  // creates a fallback connection string for Local MongoDB instance, 
  // if not found it will default to "mongodb://
  
  // Configure public DNS servers to resolve MongoDB SRV records reliably on Windows
  if (primaryUri && primaryUri.startsWith("mongodb+srv://")) {
    try {
      dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
    } catch (e) {
      console.warn("Failed to set DNS servers for SRV resolution:", e.message);
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
      // serverSelectionTimeoutMS: 5000 tells the MongoDB 
      // driver to wait 5 seconds to find an active server before it fails with a timeout error.
    });
    console.log("MongoDB connected successfully to local database (" + localUri + ")");
  } catch (error) {
    console.error("MongoDB local connection also failed:", error.message);
    console.error("Please ensure MongoDB is running or add your IP to the MongoDB Atlas whitelist.");
  }
};

module.exports = connectDB;


const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

async function sync() {
  const localUri =
    process.env.LOCAL_MONGO_URI ||
    "mongodb://127.0.0.1:27017/lifeline_connect";
  const atlasUri = process.env.MONGO_URI;

  console.log("1. Connecting to Local MongoDB (" + localUri + ")...");
  const localConn = await mongoose.createConnection(localUri).asPromise();
  console.log("✅ Local MongoDB connected successfully!");

  console.log("2. Connecting to MongoDB Atlas (" + atlasUri + ")...");
  const atlasConn = await mongoose.createConnection(atlasUri).asPromise();
  console.log("✅ MongoDB Atlas connected successfully!");

  const collections = await localConn.db.listCollections().toArray();
  console.log(`Found ${collections.length} collections to sync.\n`);

  for (const col of collections) {
    const name = col.name;
    const docs = await localConn.db.collection(name).find({}).toArray();
    console.log(`-> Syncing '${name}' (${docs.length} documents)...`);

    if (docs.length > 0) {
      await atlasConn.db.collection(name).deleteMany({});
      await atlasConn.db.collection(name).insertMany(docs);
      console.log(`   ✅ Copied ${docs.length} documents to Atlas.`);
    } else {
      console.log(`   (Collection is empty, skipped)`);
    }
  }

  console.log("\n🎉 ALL LOCAL DATA HAS BEEN SUCCESSFULLY COPIED TO MONGODB ATLAS!");
  process.exit(0);
}

sync().catch((err) => {
  console.error("\n❌ Sync failed:", err.message);
  console.error("\nNOTE: Please make sure your current IP address is whitelisted in MongoDB Atlas under 'Network Access'.");
  process.exit(1);
});

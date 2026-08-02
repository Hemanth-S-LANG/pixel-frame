import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cameraman-studio";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("DB connection not open");
  }
  const indexes = await db.collection("timeslots").indexes();
  console.log("\n=== TIMESLOT INDEXES ===");
  console.log(JSON.stringify(indexes, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);

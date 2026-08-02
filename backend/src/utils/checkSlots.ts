import "dotenv/config";
import mongoose from "mongoose";
import TimeSlot from "../models/TimeSlot.js";
import Program from "../models/Program.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cameraman-studio";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const start = new Date("2026-08-25T00:00:00");
  const end = new Date("2026-08-25T23:59:59");

  const programs = await Program.find({});
  const progMap: Record<string, string> = {};
  for (const prog of programs) {
    progMap[prog._id.toString()] = prog.name;
  }

  const slots = await TimeSlot.find({
    date: { $gte: new Date("2026-08-24T00:00:00"), $lte: new Date("2026-08-26T23:59:59") }
  });

  for (const slot of slots) {
    const pName = progMap[slot.program.toString()] || "Unknown";
    console.log(`Slot ID: ${slot._id} | Date: ${slot.date.toISOString()} | Program: ${pName} | startTime: ${slot.startTime} | isBooked: ${slot.isBooked}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);

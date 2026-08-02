import "dotenv/config";
import mongoose from "mongoose";
import TimeSlot from "../models/TimeSlot.js";
import Program from "../models/Program.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cameraman-studio";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const programs = await Program.find({});
  const progMap: Record<string, string> = {};
  for (const prog of programs) {
    progMap[prog._id.toString()] = prog.name;
  }

  // Find duplicates of (date, startTime, program)
  const duplicates = await TimeSlot.aggregate([
    {
      $group: {
        _id: { date: "$date", startTime: "$startTime", program: "$program" },
        count: { $sum: 1 },
        ids: { $push: "$_id" }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]);

  console.log(`\nFound ${duplicates.length} duplicate groups.`);
  for (const group of duplicates) {
    const pName = progMap[group._id.program?.toString()] || "Unknown";
    console.log(`Duplicate Group: Date=${group._id.date.toISOString()} | StartTime=${group._id.startTime} | Program=${pName} | Count=${group.count}`);
    for (const id of group.ids) {
      const doc = await TimeSlot.findById(id);
      console.log(`  ID=${id} | endTime=${doc?.endTime} | isBooked=${doc?.isBooked} | bookings=${doc?.currentBookings}`);
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);

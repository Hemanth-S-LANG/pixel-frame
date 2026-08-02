import "dotenv/config";
import mongoose from "mongoose";
import TimeSlot from "../models/TimeSlot.js";
import Program from "../models/Program.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cameraman-studio";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("DB connection not open");
  }

  const programs = await Program.find({});
  const progMap: Record<string, string> = {};
  for (const prog of programs) {
    progMap[prog._id.toString()] = prog.name;
  }

  // Find duplicates of (date, startTime)
  console.log("Analyzing database for duplicate (date, startTime) pairs...");
  const duplicates = await TimeSlot.aggregate([
    {
      $group: {
        _id: { date: "$date", startTime: "$startTime" },
        count: { $sum: 1 },
        slots: { $push: { id: "$_id", program: "$program", currentBookings: "$currentBookings", isBooked: "$isBooked" } }
      }
    },
    {
      $match: {
        count: { $gt: 1 }
      }
    }
  ]);

  console.log(`Found ${duplicates.length} time slots that are repeated across multiple programs.`);

  let deletedCount = 0;
  for (const group of duplicates) {
    // Determine which slot to keep:
    // 1. Prefer slots with bookings
    // 2. Otherwise prefer slot with isBooked=true (admin blocked)
    // 3. Fallback to the first slot
    let keepIndex = 0;
    for (let i = 0; i < group.slots.length; i++) {
      const s = group.slots[i];
      const best = group.slots[keepIndex];
      if (s.currentBookings > best.currentBookings) {
        keepIndex = i;
      } else if (s.currentBookings === best.currentBookings) {
        if (s.isBooked && !best.isBooked) {
          keepIndex = i;
        }
      }
    }

    const keepSlot = group.slots[keepIndex];
    const keepProgramName = progMap[keepSlot.program?.toString()] || "Unknown";
    console.log(`Date: ${group._id.date.toISOString().split("T")[0]} ${group._id.startTime} -> Keeping program: "${keepProgramName}"`);

    // Delete all other slots in this group
    for (let i = 0; i < group.slots.length; i++) {
      if (i !== keepIndex) {
        await TimeSlot.findByIdAndDelete(group.slots[i].id);
        deletedCount++;
      }
    }
  }

  console.log(`Deleted ${deletedCount} duplicate slots.`);

  // Drop old unique index and create the new one
  console.log("Updating database indexes...");
  try {
    await db.collection("timeslots").dropIndex("date_1_startTime_1_program_1");
    console.log("Dropped old unique index: date_1_startTime_1_program_1");
  } catch (err: any) {
    console.log("Old index not found or already dropped:", err.message);
  }

  try {
    await db.collection("timeslots").createIndex(
      { date: 1, startTime: 1 },
      { unique: true, name: "date_1_startTime_1" }
    );
    console.log("Created new unique index on { date: 1, startTime: 1 }");
  } catch (err: any) {
    console.error("Failed to create new unique index:", err);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch(console.error);

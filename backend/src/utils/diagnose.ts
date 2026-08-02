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
  console.log("\n=== ALL PROGRAMS ===");
  for (const prog of programs) {
    console.log(`  ${prog._id} | ${prog.name} | ${prog.category} | active=${prog.isActive}`);
  }

  // Find ALL blocked slots in August 2026
  console.log("\n=== ALL BLOCKED SLOTS (isBooked=true) IN AUGUST 2026 ===");
  const augustSlots = await TimeSlot.find({
    date: { $gte: new Date("2026-08-01T00:00:00Z"), $lte: new Date("2026-08-31T23:59:59Z") },
    isBooked: true,
  }).sort({ date: 1, program: 1, startTime: 1 });

  for (const slot of augustSlots) {
    const pName = progMap[slot.program.toString()] || "Unknown";
    const localDate = `${slot.date.getFullYear()}-${String(slot.date.getMonth() + 1).padStart(2, "0")}-${String(slot.date.getDate()).padStart(2, "0")}`;
    const utcDate = slot.date.toISOString().split("T")[0];
    console.log(`  LocalDate=${localDate} | UTCDate=${utcDate} | UTC=${slot.date.toISOString()} | Program=${pName} | ${slot.startTime}-${slot.endTime} | bookings=${slot.currentBookings}/${slot.maxBookings} | reason=${slot.blockReason || "none"}`);
  }

  // Also check: per-program blocked date analysis
  console.log("\n=== PER-PROGRAM BLOCKED DATE ANALYSIS ===");
  const allAugSlots = await TimeSlot.find({
    date: { $gte: new Date("2026-08-01T00:00:00Z"), $lte: new Date("2026-08-31T23:59:59Z") },
  });

  // Group by program and local date
  const analysis: Record<string, Record<string, { total: number; booked: number }>> = {};
  for (const slot of allAugSlots) {
    const pName = progMap[slot.program.toString()] || "Unknown";
    const localDate = `${slot.date.getFullYear()}-${String(slot.date.getMonth() + 1).padStart(2, "0")}-${String(slot.date.getDate()).padStart(2, "0")}`;
    if (!analysis[pName]) analysis[pName] = {};
    if (!analysis[pName][localDate]) analysis[pName][localDate] = { total: 0, booked: 0 };
    analysis[pName][localDate].total++;
    if (slot.isBooked || slot.currentBookings >= slot.maxBookings) {
      analysis[pName][localDate].booked++;
    }
  }

  for (const [program, dates] of Object.entries(analysis)) {
    const blockedDates: string[] = [];
    for (const [date, info] of Object.entries(dates)) {
      if (info.booked === info.total) blockedDates.push(date);
    }
    if (blockedDates.length > 0) {
      console.log(`  ${program}: FULLY BLOCKED on ${blockedDates.join(", ")}`);
    }
  }

  // Same analysis but using UTC dates (like the old code did)
  console.log("\n=== PER-PROGRAM BLOCKED DATE ANALYSIS (UTC grouping) ===");
  const analysisUTC: Record<string, Record<string, { total: number; booked: number }>> = {};
  for (const slot of allAugSlots) {
    const pName = progMap[slot.program.toString()] || "Unknown";
    const utcDate = slot.date.toISOString().split("T")[0];
    if (!analysisUTC[pName]) analysisUTC[pName] = {};
    if (!analysisUTC[pName][utcDate]) analysisUTC[pName][utcDate] = { total: 0, booked: 0 };
    analysisUTC[pName][utcDate].total++;
    if (slot.isBooked || slot.currentBookings >= slot.maxBookings) {
      analysisUTC[pName][utcDate].booked++;
    }
  }

  for (const [program, dates] of Object.entries(analysisUTC)) {
    const blockedDates: string[] = [];
    for (const [date, info] of Object.entries(dates)) {
      if (info.booked === info.total) blockedDates.push(date);
    }
    if (blockedDates.length > 0) {
      console.log(`  ${program}: FULLY BLOCKED on ${blockedDates.join(", ")}`);
    }
  }

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch(console.error);

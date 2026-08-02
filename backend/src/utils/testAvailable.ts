import "dotenv/config";
import mongoose from "mongoose";
import TimeSlot from "../models/TimeSlot.js";
import Program from "../models/Program.js";
import { getUTCMonthRange, getLocalDateStr } from "../utils/dateUtils.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cameraman-studio";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const programs = await Program.find({});
  const month = "2026-08";
  const { startDate, endDate } = getUTCMonthRange(month);

  console.log(`Querying available dates for month ${month} (${startDate.toISOString()} to ${endDate.toISOString()})`);

  for (const prog of programs) {
    const slots = await TimeSlot.find({
      program: prog._id,
      date: { $gte: startDate, $lte: endDate },
      isBooked: false,
      $expr: { $lt: ["$currentBookings", "$maxBookings"] },
    });

    const availableDates = [...new Set(
      slots.map((s) => getLocalDateStr(s.date))
    )];

    console.log(`Program: "${prog.name}" | Available dates count: ${availableDates.length} | Available: ${availableDates.slice(0, 5).join(", ")}...`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);

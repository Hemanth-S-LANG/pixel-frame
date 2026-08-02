import "dotenv/config";
import mongoose from "mongoose";
import TimeSlot from "../models/TimeSlot.js";
import Program from "../models/Program.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cameraman-studio";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const programs = await Program.find({});
  if (programs.length === 0) {
    console.log("No programs found. Seeding cannot run.");
    await mongoose.disconnect();
    return;
  }

  // 1. Keep slots that have active bookings
  console.log("Finding slots with active customer bookings...");
  const bookedSlots = await TimeSlot.find({ currentBookings: { $gt: 0 } });
  const bookedSlotIds = bookedSlots.map((s) => s._id.toString());
  console.log(`Found ${bookedSlots.length} booked slots to preserve.`);

  // 2. Delete all other slots
  console.log("Deleting all other slots to prepare for regeneration (including Sundays and round-robin)...");
  const deleteResult = await TimeSlot.deleteMany({
    _id: { $nin: bookedSlotIds },
  });
  console.log(`Deleted ${deleteResult.deletedCount} unbooked slots.`);

  // 3. Generate slots for the next 60 days (including Sundays)
  console.log("Generating timeslots for the next 60 days including Sundays...");
  const slotsToInsert = [];
  const now = new Date();
  let programIndex = 0;

  for (let dayOffset = 1; dayOffset <= 60; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(0, 0, 0, 0);

    // Slot 1: 09:00 - 14:00
    const prog1 = programs[programIndex % programs.length];
    slotsToInsert.push({
      date: new Date(date),
      startTime: "09:00",
      endTime: "14:00",
      program: prog1._id,
      isBooked: false,
      maxBookings: 1,
      currentBookings: 0,
    });
    programIndex++;

    // Slot 2: 14:00 - 19:00
    const prog2 = programs[programIndex % programs.length];
    slotsToInsert.push({
      date: new Date(date),
      startTime: "14:00",
      endTime: "19:00",
      program: prog2._id,
      isBooked: false,
      maxBookings: 1,
      currentBookings: 0,
    });
    programIndex++;

    // Slot 3: 19:00 - 23:00 (except Saturday)
    // Wait, do we want to skip Saturday evening? Let's check:
    // "why does sundays not have any slots pls add slots even for sundays if admin does not won't to workon sundays he will only block the day"
    // So yes, Sundays will have slots too. Let's add the evening slot for Sunday.
    if (date.getDay() !== 6) { // Skip Saturday evening, but keep Sunday evening
      const prog3 = programs[programIndex % programs.length];
      slotsToInsert.push({
        date: new Date(date),
        startTime: "19:00",
        endTime: "23:00",
        program: prog3._id,
        isBooked: false,
        maxBookings: 1,
        currentBookings: 0,
      });
      programIndex++;
    }
  }

  // Filter out any generated slot that would conflict with our preserved booked slots
  const finalSlotsToInsert = [];
  for (const slot of slotsToInsert) {
    const conflict = bookedSlots.some(
      (b) =>
        b.date.toISOString().split("T")[0] === slot.date.toISOString().split("T")[0] &&
        b.startTime === slot.startTime
    );
    if (!conflict) {
      finalSlotsToInsert.push(slot);
    }
  }

  const insertResult = await TimeSlot.insertMany(finalSlotsToInsert);
  console.log(`Successfully generated ${insertResult.length} slots across all programs (including Sundays).`);

  // Let's also restore the admin blocked dates 25 and 27 on August 2026
  console.log("Restoring admin blocks for Aug 25 and Aug 27, 2026...");
  const blockedDates = ["2026-08-25", "2026-08-27"];
  for (const dateStr of blockedDates) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    await TimeSlot.updateMany(
      { date: { $gte: startOfDay, $lte: endOfDay } },
      { isBooked: true, blockReason: "Owner unavailable" }
    );
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch(console.error);

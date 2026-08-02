import "dotenv/config";
import mongoose from "mongoose";
import TimeSlot from "../models/TimeSlot.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cameraman-studio";

/**
 * Migration script: Fix blocked dates that were set using the old UTC-based code.
 *
 * The old blockDate function used UTC day boundaries to query slots,
 * but the seed stored dates at LOCAL midnight (IST = UTC+5:30).
 * This caused blockDate("2026-08-25") to actually block Aug 26 local slots.
 *
 * This script:
 * 1. Unblocks ALL admin-blocked slots (isBooked=true, currentBookings=0)
 * 2. Re-blocks the CORRECT dates using local-timezone boundaries
 *
 * The dates the admin intended to block: Aug 25 and Aug 27, 2026
 */

const INTENDED_BLOCKED_DATES = ["2026-08-25", "2026-08-27"];

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Step 1: Unblock ALL admin-blocked slots
  console.log("\n=== STEP 1: Unblocking all admin-blocked slots ===");
  const unblockResult = await TimeSlot.updateMany(
    {
      isBooked: true,
      currentBookings: 0,  // Only admin-blocked, not customer-booked
    },
    {
      isBooked: false,
      $unset: { blockReason: "" },
    }
  );
  console.log(`Unblocked ${unblockResult.modifiedCount} slots`);

  // Step 2: Re-block the correct dates using local-timezone boundaries
  console.log("\n=== STEP 2: Re-blocking intended dates with local boundaries ===");
  for (const dateStr of INTENDED_BLOCKED_DATES) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const result = await TimeSlot.updateMany(
      {
        date: { $gte: startOfDay, $lte: endOfDay },
      },
      {
        isBooked: true,
        $set: { blockReason: "Owner unavailable" },
      }
    );
    console.log(`  Blocked ${result.modifiedCount} slots for ${dateStr}`);
  }

  // Step 3: Verify
  console.log("\n=== VERIFICATION ===");
  const blockedSlots = await TimeSlot.find({ isBooked: true }).sort({ date: 1 });
  const dateSet = new Set<string>();
  for (const slot of blockedSlots) {
    const y = slot.date.getFullYear();
    const m = String(slot.date.getMonth() + 1).padStart(2, "0");
    const d = String(slot.date.getDate()).padStart(2, "0");
    dateSet.add(`${y}-${m}-${d}`);
  }
  console.log(`Blocked dates (local): ${[...dateSet].sort().join(", ")}`);
  console.log(`Total blocked slots: ${blockedSlots.length}`);

  await mongoose.disconnect();
  console.log("\nMigration complete.");
}

main().catch(console.error);

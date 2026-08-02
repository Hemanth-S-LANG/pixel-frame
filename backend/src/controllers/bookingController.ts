import { Request, Response } from "express";
import TimeSlot from "../models/TimeSlot.js";
import Booking from "../models/Booking.js";
import { getUTCDayRange, getUTCMonthRange, getLocalDateStr } from "../utils/dateUtils.js";

// GET /api/bookings/available-dates?month=YYYY-MM&programId=X (programId optional)
// Returns dates in the given month that have at least one available slot.
// If programId is omitted, returns dates across ALL programs (used by user calendar
// to match the admin view which also shows all-programs availability).
export const getAvailableDates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, month } = req.query;

    if (!month) {
      res.status(400).json({ success: false, message: "month is required" });
      return;
    }

    // Parse the month to get start and end dates (UTC-safe)
    const { startDate, endDate } = getUTCMonthRange(month as string);

    const query: Record<string, unknown> = {
      date: { $gte: startDate, $lte: endDate },
      isBooked: false,
      $expr: { $lt: ["$currentBookings", "$maxBookings"] },
    };
    if (programId) {
      query.program = programId;
    }

    const slots = await TimeSlot.find(query).select("date"); // only need date field

    // Group by date and return unique available dates
    const availableDates = [...new Set(
      slots.map((s) => getLocalDateStr(s.date))
    )];

    res.json({ success: true, data: availableDates });
  } catch (error) {
    console.error("Error fetching available dates:", error);
    res.status(500).json({ success: false, message: "Failed to fetch available dates" });
  }
};

// GET /api/bookings/available-slots?date=YYYY-MM-DD&programId=X (programId optional)
// Returns available time slots for a specific date.
// If programId is provided, filters to that program only.
// If omitted, returns all available slots for that date across all programs —
// matching the admin view which shows every slot regardless of program.
export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, date } = req.query;

    if (!date) {
      res.status(400).json({ success: false, message: "date is required" });
      return;
    }

    const { startOfDay, endOfDay } = getUTCDayRange(date as string);

    const query: Record<string, unknown> = {
      date: { $gte: startOfDay, $lte: endOfDay },
      isBooked: false,
      $expr: { $lt: ["$currentBookings", "$maxBookings"] },
    };
    if (programId) {
      query.program = programId;
    }

    const slots = await TimeSlot.find(query)
      .populate("program", "name category price currency duration icon")
      .sort({ startTime: 1 });

    res.json({ success: true, data: slots });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ success: false, message: "Failed to fetch available slots" });
  }
};

// POST /api/bookings — Create a booking (called after payment verification)
// Uses ATOMIC MongoDB operations to prevent double-booking under concurrent load.
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      programId,
      timeSlotId,
      amount,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      notes,
    } = req.body;

    // ATOMIC: Reserve the time slot in a single database operation.
    // This uses findOneAndUpdate with conditions to guarantee only ONE request
    // can claim the slot even if 100 users click "Book Now" at the same instant.
    // The $inc and condition ($expr: currentBookings < maxBookings) are evaluated
    // atomically by MongoDB — no race condition possible.
    const updatedSlot = await TimeSlot.findOneAndUpdate(
      {
        _id: timeSlotId,
        isBooked: false,
        $expr: { $lt: ["$currentBookings", "$maxBookings"] },
      },
      {
        $inc: { currentBookings: 1 },
      },
      {
        new: true, // return the updated document
      }
    );

    // If null, the slot was already taken by another concurrent request
    if (!updatedSlot) {
      res.status(409).json({
        success: false,
        message: "This time slot has just been booked by someone else. Please select a different slot.",
      });
      return;
    }

    // Mark as fully booked if capacity reached
    if (updatedSlot.currentBookings >= updatedSlot.maxBookings) {
      await TimeSlot.updateOne({ _id: timeSlotId }, { isBooked: true });
    }

    // Create the booking record
    const booking = await Booking.create({
      customerName,
      customerEmail,
      customerPhone,
      program: programId,
      timeSlot: timeSlotId,
      bookingDate: updatedSlot.date,
      amount,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentStatus: "completed",
      bookingStatus: "confirmed",
      notes: notes || "",
    });

    // Populate program and slot info for the response
    await booking.populate("program");
    await booking.populate("timeSlot");

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ success: false, message: "Failed to create booking" });
  }
};

// GET /api/bookings/:id — Get booking details
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("program")
      .populate("timeSlot");

    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    console.error("Error fetching booking:", error);
    res.status(500).json({ success: false, message: "Failed to fetch booking" });
  }
};

// GET /api/bookings/blocked-dates?month=YYYY-MM&programId=X (programId optional)
// Get dates that are fully blocked (all slots booked/blocked) for a month
// Returns both a blockedDates string array and a blockReasons map { "YYYY-MM-DD": "reason" }
// When programId is provided, only checks slots for that specific program
export const getBlockedDates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month, programId } = req.query;
    if (!month) {
      res.status(400).json({ success: false, message: "Month is required" });
      return;
    }

    const { startDate, endDate } = getUTCMonthRange(month as string);

    // Build query — optionally filter by program
    const query: Record<string, unknown> = {
      date: { $gte: startDate, $lte: endDate },
    };
    if (programId) {
      query.program = programId;
    }

    // Only select the fields we need — avoids transferring large documents
    const allSlots = await TimeSlot.find(query).select("date isBooked currentBookings maxBookings blockReason");

    // Group by date: track total/booked counts and collect any block reason
    const dateMap = new Map<string, { total: number; booked: number; reason: string }>();
    for (const slot of allSlots) {
      const dateStr = getLocalDateStr(slot.date);
      const entry = dateMap.get(dateStr) || { total: 0, booked: 0, reason: "" };
      entry.total++;
      if (slot.isBooked || slot.currentBookings >= slot.maxBookings) {
        entry.booked++;
        // Capture the first non-empty block reason found for this date
        if (!entry.reason && slot.blockReason) {
          entry.reason = slot.blockReason;
        }
      }
      dateMap.set(dateStr, entry);
    }

    // Dates where ALL slots are booked/blocked = fully unavailable
    const blockedDates: string[] = [];
    const blockReasons: Record<string, string> = {};
    for (const [dateStr, info] of dateMap.entries()) {
      if (info.booked === info.total) {
        blockedDates.push(dateStr);
        if (info.reason) {
          blockReasons[dateStr] = info.reason;
        }
      }
    }

    res.json({
      success: true,
      data: { blockedDates, blockReasons },
    });
  } catch (error) {
    console.error("Error fetching blocked dates:", error);
    res.status(500).json({ success: false, message: "Failed to fetch blocked dates" });
  }
};

import { Request, Response } from "express";
import Razorpay from "razorpay";
import TimeSlot from "../models/TimeSlot.js";
import Booking from "../models/Booking.js";
import Program from "../models/Program.js";
import { getUTCDayRange, getUTCMonthRange, getLocalDateStr } from "../utils/dateUtils.js";
import { verifyRazorpaySignature } from "../utils/verifyRazorpaySignature.js";
import { isValidEmail, isValidPhone, isValidName } from "../utils/validators.js";

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

// POST /api/bookings — Create a booking after verified payment.
//
// Security order of operations (must all pass before any DB write):
//   1. Verify Razorpay signature server-side (HMAC-SHA256, timing-safe).
//   2. Look up Program.price server-side — never trust amount from client.
//      Also confirm the Razorpay order is "paid" and amount_paid matches.
//   3. Atomic slot reservation (existing findOneAndUpdate — unchanged).
//   4. Create Booking. razorpayOrderId has a unique index — duplicate
//      payments are caught as 409 instead of 500.
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      customerName,
      customerEmail,
      customerPhone,
      programId,
      timeSlotId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      notes,
      // NOTE: `amount` from req.body is intentionally ignored — we look up
      //       the authoritative price from the DB below.
    } = req.body;

    // ── GUARD: required fields ──────────────────────────────────────────────
    if (!customerName || !customerEmail || !customerPhone || !programId ||
        !timeSlotId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      res.status(400).json({ success: false, message: "Missing required booking fields" });
      return;
    }

    // ── GUARD: format validation (trim first, then check) ───────────────────
    const trimmedName  = String(customerName).trim();
    const trimmedEmail = String(customerEmail).trim();
    const trimmedPhone = String(customerPhone).trim();

    if (!isValidName(trimmedName)) {
      res.status(400).json({ success: false, message: "Invalid name — must contain at least one letter and be at most 100 characters" });
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      res.status(400).json({ success: false, message: "Invalid email format" });
      return;
    }
    if (!isValidPhone(trimmedPhone)) {
      res.status(400).json({ success: false, message: "Invalid phone number — must be a 10-digit Indian mobile number" });
      return;
    }

    // ── STEP 1: Verify Razorpay signature (timing-safe HMAC-SHA256) ─────────
    // Any fake/tampered values will fail here before touching the DB.
    let signatureValid: boolean;
    try {
      signatureValid = verifyRazorpaySignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        process.env.RAZORPAY_KEY_SECRET as string
      );
    } catch (err) {
      console.error("Signature verification error:", err);
      res.status(500).json({ success: false, message: "Payment verification configuration error" });
      return;
    }

    if (!signatureValid) {
      res.status(400).json({
        success: false,
        message: "Payment signature verification failed — possible tampering detected",
      });
      return;
    }

    // ── STEP 2a: Look up authoritative price from DB ─────────────────────────
    const program = await Program.findById(programId).lean();
    if (!program) {
      res.status(400).json({ success: false, message: "Program not found" });
      return;
    }
    const authorizedAmount = program.price; // in paise — never trust client

    // ── STEP 2b: Verify order status and amount_paid with Razorpay API ───────
    try {
      const razorpay = new Razorpay({
        key_id:     process.env.RAZORPAY_KEY_ID as string,
        key_secret: process.env.RAZORPAY_KEY_SECRET as string,
      });

      const order = await razorpay.orders.fetch(razorpayOrderId);

      if (order.status !== "paid") {
        res.status(400).json({
          success: false,
          message: `Payment not completed — order status is "${order.status}"`,
        });
        return;
      }

      const amountPaid = typeof order.amount_paid === "string"
        ? parseInt(order.amount_paid, 10)
        : Number(order.amount_paid);

      if (amountPaid !== authorizedAmount) {
        res.status(400).json({
          success: false,
          message: "Amount paid does not match program price — booking rejected",
        });
        return;
      }
    } catch (err: unknown) {
      // If razorpay.orders.fetch itself throws, it means the orderId is fake
      // (Razorpay returns a 404-equivalent for non-existent orders).
      const message = err instanceof Error ? err.message : String(err);
      console.error("Razorpay order fetch failed:", message);
      res.status(400).json({
        success: false,
        message: "Could not verify payment order with Razorpay — invalid order ID",
      });
      return;
    }

    // ── STEP 3: ATOMIC slot reservation ──────────────────────────────────────
    // Unchanged from original — findOneAndUpdate is atomic in MongoDB.
    const updatedSlot = await TimeSlot.findOneAndUpdate(
      {
        _id: timeSlotId,
        isBooked: false,
        $expr: { $lt: ["$currentBookings", "$maxBookings"] },
      },
      { $inc: { currentBookings: 1 } },
      { new: true }
    );

    if (!updatedSlot) {
      res.status(409).json({
        success: false,
        message: "This time slot has just been booked by someone else. Please select a different slot.",
      });
      return;
    }

    // Mark slot as fully booked if capacity reached
    if (updatedSlot.currentBookings >= updatedSlot.maxBookings) {
      await TimeSlot.updateOne({ _id: timeSlotId }, { isBooked: true });
    }

    // ── STEP 4: Create Booking ────────────────────────────────────────────────
    // razorpayOrderId has unique:true — Mongo will reject a duplicate with
    // error code 11000, caught below and returned as a clean 409.
    try {
      const booking = await Booking.create({
        customerName:     trimmedName,
        customerEmail:    trimmedEmail,
        customerPhone:    trimmedPhone,
        program:          programId,
        timeSlot:         timeSlotId,
        bookingDate:      updatedSlot.date,
        amount:           authorizedAmount,   // ← server-authoritative price
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        paymentStatus:  "completed",
        bookingStatus:  "confirmed",
        notes:          notes || "",
      });

      await booking.populate("program");
      await booking.populate("timeSlot");

      res.status(201).json({ success: true, data: booking });
    } catch (dbErr: unknown) {
      // Duplicate razorpayOrderId — this payment was already used for a booking
      const mongoErr = dbErr as { code?: number };
      if (mongoErr.code === 11000) {
        // Roll back the slot increment we just made (payment already consumed)
        await TimeSlot.updateOne(
          { _id: timeSlotId },
          { $inc: { currentBookings: -1 }, isBooked: false }
        );
        res.status(409).json({
          success: false,
          message: "This payment has already been used for a booking",
        });
        return;
      }
      throw dbErr; // re-throw unexpected DB errors to outer catch
    }
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

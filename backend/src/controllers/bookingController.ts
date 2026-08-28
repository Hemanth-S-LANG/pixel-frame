import { Request, Response } from "express";
import Razorpay from "razorpay";
import jwt from "jsonwebtoken";
import TimeSlot from "../models/TimeSlot.js";
import Booking from "../models/Booking.js";
import Program from "../models/Program.js";
import { getUTCDayRange, getUTCMonthRange, getLocalDateStr } from "../utils/dateUtils.js";
import { verifyRazorpaySignature } from "../utils/verifyRazorpaySignature.js";
import { isValidEmail, isValidPhone, isValidName } from "../utils/validators.js";
import { generateReceiptPdf } from "../utils/generateReceiptPdf.js";

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

      // Issue a signed 48h receipt download token — sent to the client so they
      // can download a PDF confirmation without needing an account.
      const receiptToken = jwt.sign(
        { bookingId: String(booking._id), purpose: "receipt_download" },
        process.env.JWT_SECRET as string,
        { expiresIn: "48h" }
      );

      res.status(201).json({ success: true, data: booking, receiptToken });
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

// GET /api/bookings/:id?token=<receiptToken> — Get booking details
// Protected by the same signed token issued by createBooking (purpose: "receipt_download").
// Returns 401 if token is missing/invalid, 403 if it doesn't match this booking.
export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;
    const { token } = req.query;

    if (!token) {
      res.status(401).json({ success: false, message: "Access token is required" });
      return;
    }

    // Verify the signed token
    let payload: { bookingId?: string; purpose?: string };
    try {
      payload = jwt.verify(token as string, process.env.JWT_SECRET as string) as typeof payload;
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired token" });
      return;
    }

    // Token must be a receipt_download token and must match the requested booking
    if (payload.purpose !== "receipt_download" || payload.bookingId !== id) {
      res.status(403).json({ success: false, message: "Token does not match this booking" });
      return;
    }

    const booking = await Booking.findById(id)
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

// ── Shared PDF helper ─────────────────────────────────────────────────────────
// Extracts populated fields from a booking and calls generateReceiptPdf.
async function buildReceiptBuffer(bookingId: string): Promise<{ pdf: Buffer; filename: string } | null> {
  const booking = await Booking.findById(bookingId)
    .populate("program")
    .populate("timeSlot")
    .lean();

  if (!booking) return null;

  const program  = booking.program  as unknown as { name: string; price: number; currency: string } | null;
  const timeSlot = booking.timeSlot as unknown as { startTime: string; endTime: string } | null;

  const pdf = await generateReceiptPdf({
    bookingId:         String(booking._id),
    customerName:      booking.customerName,
    customerEmail:     booking.customerEmail,
    customerPhone:     booking.customerPhone,
    programName:       program?.name      ?? "Unknown Service",
    programPrice:      program?.price     ?? booking.amount,
    currency:          program?.currency  ?? booking.currency ?? "INR",
    bookingDate:       booking.bookingDate,
    startTime:         timeSlot?.startTime ?? "—",
    endTime:           timeSlot?.endTime   ?? "—",
    razorpayPaymentId: booking.razorpayPaymentId,
    paymentStatus:     booking.paymentStatus,
    bookingStatus:     booking.bookingStatus,
  });

  return { pdf, filename: `receipt-${bookingId}.pdf` };
}

// GET /api/bookings/:id/receipt?token=<receiptToken>
// Public route — verifies the signed token issued by createBooking, streams PDF.
export const getBookingReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { token } = req.query;

    if (!token) {
      res.status(401).json({ success: false, message: "Receipt token is required" });
      return;
    }

    // Verify and validate the token
    let payload: { bookingId?: string; purpose?: string };
    try {
      payload = jwt.verify(token as string, process.env.JWT_SECRET as string) as typeof payload;
    } catch {
      res.status(401).json({ success: false, message: "Invalid or expired receipt token" });
      return;
    }

    if (payload.purpose !== "receipt_download") {
      res.status(403).json({ success: false, message: "Token is not valid for receipt download" });
      return;
    }

    if (payload.bookingId !== id) {
      res.status(403).json({ success: false, message: "Token does not match this booking" });
      return;
    }

    // Verify booking exists and payment is completed
    const booking = await Booking.findById(id).lean();
    if (!booking) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }
    if (booking.paymentStatus !== "completed") {
      res.status(400).json({ success: false, message: "Receipt is only available for completed payments" });
      return;
    }

    const result = await buildReceiptBuffer(id);
    if (!result) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.set("Content-Length", String(result.pdf.length));
    res.send(result.pdf);
  } catch (error) {
    console.error("Error generating customer receipt:", error);
    res.status(500).json({ success: false, message: "Failed to generate receipt" });
  }
};

// GET /api/admin/bookings/:id/receipt
// Admin route (protected by requireAdmin middleware in adminRoutes.ts).
// No token required — admin is already authenticated via cookie.
// Returns PDF for any booking regardless of paymentStatus (admin reference use).
export const getAdminBookingReceipt = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const result = await buildReceiptBuffer(id);
    if (!result) {
      res.status(404).json({ success: false, message: "Booking not found" });
      return;
    }

    res.set("Content-Type", "application/pdf");
    res.set("Content-Disposition", `attachment; filename="${result.filename}"`);
    res.set("Content-Length", String(result.pdf.length));
    res.send(result.pdf);
  } catch (error) {
    console.error("Error generating admin receipt:", error);
    res.status(500).json({ success: false, message: "Failed to generate receipt" });
  }
};

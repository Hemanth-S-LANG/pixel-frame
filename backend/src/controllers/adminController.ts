import { Request, Response } from "express";
import mongoose from "mongoose";
import TimeSlot from "../models/TimeSlot.js";
import Booking from "../models/Booking.js";
import Program from "../models/Program.js";
import { getUTCDayRange, getUTCMonthRange, getLocalDateStr } from "../utils/dateUtils.js";

// POST /api/admin/block-date
// Block all slots for a specific date (owner is on leave / unavailable)
export const blockDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, reason } = req.body;

    if (!date) {
      res.status(400).json({ success: false, message: "Date is required" });
      return;
    }

    const { startOfDay, endOfDay } = getUTCDayRange(date);

    // Mark all slots for this date as booked
    const result = await TimeSlot.updateMany(
      {
        date: { $gte: startOfDay, $lte: endOfDay },
      },
      {
        isBooked: true,
        $set: { blockReason: reason || "Owner unavailable" },
      }
    );

    res.json({
      success: true,
      message: `Blocked ${result.modifiedCount} slots for ${date}`,
      data: { blockedSlots: result.modifiedCount },
    });
  } catch (error) {
    console.error("Error blocking date:", error);
    res.status(500).json({ success: false, message: "Failed to block date" });
  }
};

// POST /api/admin/unblock-date
// Unblock all slots for a specific date (owner back from leave)
export const unblockDate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.body;

    if (!date) {
      res.status(400).json({ success: false, message: "Date is required" });
      return;
    }

    const { startOfDay, endOfDay } = getUTCDayRange(date);

    // Only unblock slots that don't have actual bookings
    // (slots that were admin-blocked, not customer-booked)
    const result = await TimeSlot.updateMany(
      {
        date: { $gte: startOfDay, $lte: endOfDay },
        currentBookings: 0, // Only unblock slots with no real bookings
      },
      {
        isBooked: false,
        $unset: { blockReason: "" },
      }
    );

    res.json({
      success: true,
      message: `Unblocked ${result.modifiedCount} slots for ${date}`,
      data: { unblockedSlots: result.modifiedCount },
    });
  } catch (error) {
    console.error("Error unblocking date:", error);
    res.status(500).json({ success: false, message: "Failed to unblock date" });
  }
};

// POST /api/admin/block-slot
// Block a specific time slot
export const blockSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slotId, reason } = req.body;

    if (!slotId) {
      res.status(400).json({ success: false, message: "slotId is required" });
      return;
    }

    const slot = await TimeSlot.findByIdAndUpdate(
      slotId,
      { isBooked: true, blockReason: reason || "Slot unavailable" },
      { new: true }
    );

    if (!slot) {
      res.status(404).json({ success: false, message: "Slot not found" });
      return;
    }

    res.json({ success: true, message: "Slot blocked", data: slot });
  } catch (error) {
    console.error("Error blocking slot:", error);
    res.status(500).json({ success: false, message: "Failed to block slot" });
  }
};

// POST /api/admin/unblock-slot
// Unblock a specific time slot
export const unblockSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slotId } = req.body;

    if (!slotId) {
      res.status(400).json({ success: false, message: "slotId is required" });
      return;
    }

    const slot = await TimeSlot.findById(slotId);
    if (!slot) {
      res.status(404).json({ success: false, message: "Slot not found" });
      return;
    }

    // Don't unblock if there's a real booking
    if (slot.currentBookings > 0) {
      res.status(400).json({ success: false, message: "Cannot unblock a slot with existing bookings" });
      return;
    }

    slot.isBooked = false;
    slot.blockReason = "";
    await slot.save();

    res.json({ success: true, message: "Slot unblocked", data: slot });
  } catch (error) {
    console.error("Error unblocking slot:", error);
    res.status(500).json({ success: false, message: "Failed to unblock slot" });
  }
};

// GET /api/admin/slots?date=YYYY-MM-DD
// Get ALL slots for a date (including booked ones) for admin view
export const getAdminSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date } = req.query;

    if (!date) {
      res.status(400).json({ success: false, message: "Date is required" });
      return;
    }

    const { startOfDay, endOfDay } = getUTCDayRange(date as string);

    const slots = await TimeSlot.find({
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("program", "name category")
      .sort({ program: 1, startTime: 1 });

    res.json({ success: true, data: slots });
  } catch (error) {
    console.error("Error fetching admin slots:", error);
    res.status(500).json({ success: false, message: "Failed to fetch slots" });
  }
};

// GET /api/admin/bookings?page=1&limit=20
// Get all bookings for admin dashboard
export const getAdminBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [bookings, total] = await Promise.all([
      Booking.find()
        .populate("program", "name category")
        .populate("timeSlot", "date startTime endTime")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(),
    ]);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, message: "Failed to fetch bookings" });
  }
};

// GET /api/admin/stats
// Dashboard stats
export const getAdminStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const { startOfDay: today, endOfDay: todayEnd } = getUTCDayRange(todayStr);

    const [
      totalBookings,
      todayBookings,
      totalRevenue,
      totalPrograms,
    ] = await Promise.all([
      Booking.countDocuments({ paymentStatus: "completed" }),
      Booking.countDocuments({
        bookingDate: { $gte: today, $lte: todayEnd },
        paymentStatus: "completed",
      }),
      Booking.aggregate([
        { $match: { paymentStatus: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Program.countDocuments({ isActive: true }),
    ]);

    res.json({
      success: true,
      data: {
        totalBookings,
        todayBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalPrograms,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ success: false, message: "Failed to fetch stats" });
  }
};

// GET /api/admin/blocked-dates?month=YYYY-MM
// Get dates that are fully blocked (all slots booked/blocked) for a month
export const getBlockedDates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month } = req.query;
    if (!month) {
      res.status(400).json({ success: false, message: "Month is required" });
      return;
    }

    const { startDate, endDate } = getUTCMonthRange(month as string);

    // Find dates where ALL slots are booked
    const allSlots = await TimeSlot.find({
      date: { $gte: startDate, $lte: endDate },
    });

    // Group by date
    const dateMap = new Map<string, { total: number; booked: number }>();
    for (const slot of allSlots) {
      const dateStr = getLocalDateStr(slot.date);
      const entry = dateMap.get(dateStr) || { total: 0, booked: 0 };
      entry.total++;
      if (slot.isBooked || slot.currentBookings >= slot.maxBookings) {
        entry.booked++;
      }
      dateMap.set(dateStr, entry);
    }

    // Dates where ALL slots are booked = fully blocked
    const blockedDates: string[] = [];
    for (const [dateStr, info] of dateMap.entries()) {
      if (info.booked === info.total) {
        blockedDates.push(dateStr);
      }
    }

    res.json({
      success: true,
      data: { blockedDates },
    });
  } catch (error) {
    console.error("Error fetching blocked dates:", error);
    res.status(500).json({ success: false, message: "Failed to fetch blocked dates" });
  }
};

// PUT /api/admin/slots/:id
// Update a slot's start time, end time, and/or program
export const updateSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { startTime, endTime, program } = req.body;

    if (!startTime || !endTime) {
      res.status(400).json({ success: false, message: "startTime and endTime are required" });
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      res.status(400).json({ success: false, message: "Invalid time format. Use HH:MM (e.g. 09:00)" });
      return;
    }

    if (startTime >= endTime) {
      res.status(400).json({ success: false, message: "Start time must be before end time" });
      return;
    }

    const slot = await TimeSlot.findById(id);
    if (!slot) {
      res.status(404).json({ success: false, message: "Slot not found" });
      return;
    }

    // Don't allow editing slots that have real bookings
    if (slot.currentBookings > 0) {
      res.status(400).json({ success: false, message: "Cannot edit a slot that has existing bookings" });
      return;
    }

    // Validate/Resolve program if provided
    if (program) {
      let targetProgram;
      
      // Check if it's a valid ObjectId first
      const isValidObjectId = mongoose.Types.ObjectId.isValid(program);
      if (isValidObjectId) {
        targetProgram = await Program.findById(program);
      }
      
      // If not found by ID, search by name (case-insensitive)
      if (!targetProgram) {
        targetProgram = await Program.findOne({ name: { $regex: new RegExp(`^${program.trim()}$`, "i") } });
      }
      
      // If still not found, we create a new program by copying the current slot's program properties
      if (!targetProgram) {
        // Fetch the slot's current program to copy its properties
        const currentProgram = await Program.findById(slot.program);
        if (currentProgram) {
          targetProgram = await Program.create({
            name: program.trim(),
            description: currentProgram.description,
            price: currentProgram.price,
            currency: currentProgram.currency,
            duration: currentProgram.duration,
            category: currentProgram.category,
            image: currentProgram.image,
            icon: currentProgram.icon,
            tags: currentProgram.tags,
            isActive: true,
          });
        } else {
          // Fallback if current program is somehow missing
          targetProgram = await Program.create({
            name: program.trim(),
            description: `Custom program for ${program.trim()}`,
            price: 500, // default 5 INR
            currency: "INR",
            duration: "1 hour",
            category: "photography",
            image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=600&fit=crop&auto=format",
            icon: "Camera",
            tags: ["Custom"],
            isActive: true,
          });
        }
      }
      
      slot.program = targetProgram._id as mongoose.Types.ObjectId;
    }

    slot.startTime = startTime;
    slot.endTime = endTime;
    await slot.save();

    // Re-fetch with populated program
    const updatedSlot = await TimeSlot.findById(id).populate("program", "name category");

    res.json({ success: true, message: "Slot updated", data: updatedSlot });
  } catch (error) {
    console.error("Error updating slot:", error);
    res.status(500).json({ success: false, message: "Failed to update slot" });
  }
};

// POST /api/admin/slots
// Create a new time slot
export const createSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, startTime, endTime, program } = req.body;

    if (!date || !startTime || !endTime || !program) {
      res.status(400).json({ success: false, message: "Date, startTime, endTime, and program are required" });
      return;
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      res.status(400).json({ success: false, message: "Invalid time format. Use HH:MM (e.g. 09:00)" });
      return;
    }

    if (startTime >= endTime) {
      res.status(400).json({ success: false, message: "Start time must be before end time" });
      return;
    }

    // Get local day range
    const { startOfDay } = getUTCDayRange(date);

    // Resolve program
    let targetProgram;
    const isValidObjectId = mongoose.Types.ObjectId.isValid(program);
    if (isValidObjectId) {
      targetProgram = await Program.findById(program);
    }

    if (!targetProgram) {
      targetProgram = await Program.findOne({ name: { $regex: new RegExp(`^${program.trim()}$`, "i") } });
    }

    if (!targetProgram) {
      // If no program exists at all, clone an existing one or create a default
      const anyProgram = await Program.findOne();
      if (anyProgram) {
        targetProgram = await Program.create({
          name: program.trim(),
          description: anyProgram.description,
          price: anyProgram.price,
          currency: anyProgram.currency,
          duration: anyProgram.duration,
          category: anyProgram.category,
          image: anyProgram.image,
          icon: anyProgram.icon,
          tags: anyProgram.tags,
          isActive: true,
        });
      } else {
        targetProgram = await Program.create({
          name: program.trim(),
          description: `Custom program for ${program.trim()}`,
          price: 500, // default 5 INR
          currency: "INR",
          duration: "1 hour",
          category: "photography",
          image: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&h=600&fit=crop&auto=format",
          icon: "Camera",
          tags: ["Custom"],
          isActive: true,
        });
      }
    }

    // Check if a slot with same date and startTime already exists
    const slotExists = await TimeSlot.findOne({
      date: startOfDay,
      startTime,
    });

    if (slotExists) {
      res.status(400).json({ success: false, message: "A slot at this start time already exists on this date" });
      return;
    }

    const newSlot = await TimeSlot.create({
      date: startOfDay,
      startTime,
      endTime,
      program: targetProgram._id,
      isBooked: false,
      maxBookings: 1,
      currentBookings: 0,
    });

    const populatedSlot = await TimeSlot.findById(newSlot._id).populate("program", "name category");

    res.status(201).json({ success: true, message: "Slot created successfully", data: populatedSlot });
  } catch (error) {
    console.error("Error creating slot:", error);
    res.status(500).json({ success: false, message: "Failed to create slot" });
  }
};

// DELETE /api/admin/slots/:id
// Delete a specific time slot
export const deleteSlot = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const slot = await TimeSlot.findById(id);
    if (!slot) {
      res.status(404).json({ success: false, message: "Slot not found" });
      return;
    }

    // Don't allow deleting slots that have real bookings
    if (slot.currentBookings > 0) {
      res.status(400).json({ success: false, message: "Cannot delete a slot with existing bookings" });
      return;
    }

    await TimeSlot.findByIdAndDelete(id);

    res.json({ success: true, message: "Slot deleted successfully" });
  } catch (error) {
    console.error("Error deleting slot:", error);
    res.status(500).json({ success: false, message: "Failed to delete slot" });
  }
};

// GET /api/admin/available-dates?month=YYYY-MM
// Returns all dates in the month that have at least one available (non-booked) slot
// Used by admin calendar to show green dots accurately across all programs
export const getAdminAvailableDates = async (req: Request, res: Response): Promise<void> => {
  try {
    const { month } = req.query;
    if (!month) {
      res.status(400).json({ success: false, message: "Month is required" });
      return;
    }

    const { startDate, endDate } = getUTCMonthRange(month as string);

    const slots = await TimeSlot.find({
      date: { $gte: startDate, $lte: endDate },
      isBooked: false,
      $expr: { $lt: ["$currentBookings", "$maxBookings"] },
    }).select("date");

    const availableDates = [...new Set(slots.map((s) => getLocalDateStr(s.date)))];

    res.json({ success: true, data: availableDates });
  } catch (error) {
    console.error("Error fetching admin available dates:", error);
    res.status(500).json({ success: false, message: "Failed to fetch available dates" });
  }
};

// PUT /api/admin/update-block-reason
// Update block reason for already blocked slots on a date
export const updateBlockReason = async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, reason } = req.body;
    if (!date) {
      res.status(400).json({ success: false, message: "Date is required" });
      return;
    }
    const { startOfDay, endOfDay } = getUTCDayRange(date);
    await TimeSlot.updateMany(
      { date: { $gte: startOfDay, $lte: endOfDay }, isBooked: true },
      { blockReason: reason || "" }
    );
    res.json({ success: true, message: "Block reason updated successfully" });
  } catch (error) {
    console.error("Error updating block reason:", error);
    res.status(500).json({ success: false, message: "Failed to update block reason" });
  }
};


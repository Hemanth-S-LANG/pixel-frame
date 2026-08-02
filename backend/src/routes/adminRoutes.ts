import { Router } from "express";
import { adminLogin, requireAdmin } from "../middleware/adminAuth.js";
import {
  blockDate,
  unblockDate,
  blockSlot,
  unblockSlot,
  getAdminSlots,
  getAdminBookings,
  getAdminStats,
  getBlockedDates,
  updateSlot,
  createSlot,
  deleteSlot,
  updateBlockReason,
  getAdminAvailableDates,
} from "../controllers/adminController.js";

const router = Router();

// Public — login
router.post("/login", adminLogin);

// All routes below require admin JWT token
router.use(requireAdmin);

// Date management
router.post("/block-date", blockDate);
router.post("/unblock-date", unblockDate);
router.put("/update-block-reason", updateBlockReason);

// Slot management
router.post("/block-slot", blockSlot);
router.post("/unblock-slot", unblockSlot);
router.post("/slots", createSlot);
router.put("/slots/:id", updateSlot);
router.delete("/slots/:id", deleteSlot);

// Admin views
router.get("/slots", getAdminSlots);
router.get("/bookings", getAdminBookings);
router.get("/stats", getAdminStats);
router.get("/blocked-dates", getBlockedDates);
router.get("/available-dates", getAdminAvailableDates);

export default router;

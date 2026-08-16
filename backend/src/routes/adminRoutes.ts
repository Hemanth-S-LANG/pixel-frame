import { Router } from "express";
import { adminLogin, adminLogout, requireAdmin } from "../middleware/adminAuth.js";
import {
  blockDate, unblockDate, blockSlot, unblockSlot,
  getAdminSlots, getAdminBookings, getAdminStats,
  getBlockedDates, updateSlot, createSlot, deleteSlot,
  updateBlockReason, getAdminAvailableDates, cancelBooking,
} from "../controllers/adminController.js";
import {
  getMessages, getUnreadCount, markMessageRead, deleteMessage,
} from "../controllers/messageController.js";
import { getAdminBookingReceipt } from "../controllers/bookingController.js";

const router = Router();

// Public — login / logout (no auth required)
router.post("/login",  adminLogin);
router.post("/logout", adminLogout);

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
router.post("/bookings/:id/cancel", cancelBooking);
router.get("/bookings/:id/receipt", getAdminBookingReceipt);

// Messages
router.get("/messages", getMessages);
router.get("/messages/unread-count", getUnreadCount);
router.patch("/messages/:id/read", markMessageRead);
router.delete("/messages/:id", deleteMessage);

export default router;

import { Router } from "express";
import {
  getAvailableDates,
  getAvailableSlots,
  createBooking,
  getBookingById,
  getBlockedDates,
  getBookingReceipt,
} from "../controllers/bookingController.js";

const router = Router();

router.get("/blocked-dates", getBlockedDates);
router.get("/available-dates", getAvailableDates);
router.get("/available-slots", getAvailableSlots);
router.post("/", createBooking);
router.get("/:id/receipt", getBookingReceipt);  // must be before /:id
router.get("/:id", getBookingById);

export default router;

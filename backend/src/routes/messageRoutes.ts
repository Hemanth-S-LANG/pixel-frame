import { Router } from "express";
import { createMessage, sendOtp, verifyOtp } from "../controllers/messageController.js";

const router = Router();

router.post("/",            createMessage);
router.post("/send-otp",    sendOtp);
router.post("/verify-otp",  verifyOtp);

export default router;

import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import Message from "../models/Message.js";
import { isValidEmail, isValidPhone, isValidName } from "../utils/validators.js";

// Purpose claim — prevents a phone_verify token being reused for admin auth or vice-versa
const PHONE_VERIFY_PURPOSE = "phone_verify";
const TOKEN_TTL = "15m";

/**
 * Issues a short-lived JWT proving this phone number was OTP-verified by our server.
 * Signed with JWT_SECRET, purpose claim prevents cross-feature reuse.
 */
function issuePhoneVerifiedToken(phone: string): string {
  return jwt.sign(
    { phone, purpose: PHONE_VERIFY_PURPOSE },
    process.env.JWT_SECRET as string,
    { expiresIn: TOKEN_TTL }
  );
}

// POST /api/messages — Submit a contact message (public)
// `phoneVerifiedToken` (optional): a JWT issued by verifyOtp — the only accepted proof.
// A raw `phoneVerified` boolean from req.body is NEVER trusted.
export const createMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, phoneVerifiedToken, service, message } = req.body;

    if (!name || !email || !phone || !message) {
      res.status(400).json({ success: false, message: "name, email, phone, and message are required" });
      return;
    }

    // ── Format validation (trim first, then check) ──────────────────────────
    const trimmedName  = String(name).trim();
    const trimmedEmail = String(email).trim();
    const trimmedPhone = String(phone).trim();

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

    // Resolve phoneVerified from token — never from a raw boolean in req.body
    let phoneVerified = false;

    if (phoneVerifiedToken) {
      try {
        const payload = jwt.verify(
          phoneVerifiedToken,
          process.env.JWT_SECRET as string
        ) as { phone?: string; purpose?: string };

        if (
          payload.purpose === PHONE_VERIFY_PURPOSE &&
          payload.phone   === phone.trim()
        ) {
          phoneVerified = true;
        }
        // If purpose or phone doesn't match, silently treat as false
      } catch {
        // Expired, tampered, or garbage token — treat as unverified, do NOT throw
        phoneVerified = false;
      }
    }

    const msg = await Message.create({
      name:    trimmedName,
      email:   trimmedEmail,
      phone:   trimmedPhone,
      phoneVerified,
      service: service || "",
      message,
    });

    res.status(201).json({ success: true, data: { _id: msg._id } });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ success: false, message: "Failed to send message" });
  }
};

// GET /api/admin/messages?page=1&limit=20 — Get all messages (admin only)
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const page  = parseInt(req.query.page  as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip  = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Message.countDocuments(),
    ]);

    res.json({
      success: true,
      data: messages,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Failed to fetch messages" });
  }
};

// GET /api/admin/messages/unread-count — Count of unread messages (admin)
export const getUnreadCount = async (_req: Request, res: Response): Promise<void> => {
  try {
    const count = await Message.countDocuments({ isRead: false });
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch unread count" });
  }
};

// PATCH /api/admin/messages/:id/read — Mark a message as read (admin)
export const markMessageRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!msg) { res.status(404).json({ success: false, message: "Message not found" }); return; }
    res.json({ success: true, data: msg });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to mark message as read" });
  }
};

// DELETE /api/admin/messages/:id — Delete a message (admin)
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const msg = await Message.findByIdAndDelete(req.params.id);
    if (!msg) { res.status(404).json({ success: false, message: "Message not found" }); return; }
    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete message" });
  }
};

// POST /api/messages/send-otp — Send OTP via MSG91 Widget REST API (no captcha, no DLT)
export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone } = req.body;
    if (!phone) {
      res.status(400).json({ success: false, message: "phone is required" });
      return;
    }

    const apiKey   = process.env.MSG91_API_KEY;
    const widgetId = process.env.MSG91_WIDGET_ID;

    if (!apiKey || !widgetId) {
      console.warn("MSG91 keys not set — dev mode bypass");
      res.json({ success: true, devMode: true, reqId: "dev-req-id" });
      return;
    }

    const response = await fetch("https://api.msg91.com/api/v5/widget/sendOtp", {
      method: "POST",
      headers: { "authkey": apiKey, "content-type": "application/json" },
      body: JSON.stringify({ widgetId, identifier: `91${phone}` }),
    });

    const data = await response.json();
    console.log("MSG91 sendOtp response:", data);

    if (data.type === "success" || data.reqId) {
      res.json({ success: true, reqId: data.reqId || data.data?.reqId });
    } else {
      res.status(400).json({ success: false, message: data.message || "Failed to send OTP" });
    }
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP" });
  }
};

// POST /api/messages/verify-otp — Verify OTP; on success issue a phoneVerifiedToken JWT
// The token is the ONLY server-side proof that a phone number was OTP-verified.
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reqId, otp, token, phone } = req.body;

    const apiKey   = process.env.MSG91_API_KEY;
    const widgetId = process.env.MSG91_WIDGET_ID;

    // ── Dev-mode bypass (no MSG91 keys configured) ────────────────────────────
    if (!apiKey || !widgetId) {
      const valid = /^\d{4,6}$/.test(otp || "");
      if (valid && phone) {
        const phoneVerifiedToken = issuePhoneVerifiedToken(phone.trim());
        res.json({ success: true, verified: true, phoneVerifiedToken, message: "Verified (dev mode)" });
      } else {
        res.json({ success: false, verified: false, message: "Invalid OTP (dev mode)" });
      }
      return;
    }

    // ── Widget browser-token path (MSG91 widget called success on frontend) ───
    if (token && !reqId) {
      const verifyRes = await fetch(
        `https://api.msg91.com/api/v5/widget/verifyAccessToken?access-token=${token}`,
        { method: "GET", headers: { "authkey": apiKey } }
      );
      const data = await verifyRes.json();
      if (data.type === "success" && phone) {
        const phoneVerifiedToken = issuePhoneVerifiedToken(phone.trim());
        res.json({ success: true, verified: true, phoneVerifiedToken });
      } else {
        res.status(400).json({ success: false, verified: false, message: "Token verification failed" });
      }
      return;
    }

    // ── Standard REST path: verify OTP using reqId ────────────────────────────
    if (!reqId || !otp) {
      res.status(400).json({ success: false, message: "reqId and otp are required" });
      return;
    }

    const response = await fetch("https://api.msg91.com/api/v5/widget/verifyOtp", {
      method: "POST",
      headers: { "authkey": apiKey, "content-type": "application/json" },
      body: JSON.stringify({ widgetId, reqId, otp }),
    });

    const data = await response.json();
    console.log("MSG91 verifyOtp response:", data);

    if (data.type === "success" || data.message === "OTP verified successfully") {
      if (!phone) {
        res.status(400).json({ success: false, message: "phone is required to issue verification token" });
        return;
      }
      const phoneVerifiedToken = issuePhoneVerifiedToken(phone.trim());
      res.json({ success: true, verified: true, phoneVerifiedToken });
    } else {
      res.status(400).json({ success: false, verified: false, message: data.message || "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};

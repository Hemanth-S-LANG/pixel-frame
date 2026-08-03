import { Request, Response } from "express";
import Message from "../models/Message.js";

// POST /api/messages — Submit a contact message (public)
export const createMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, phone, phoneVerified, service, message } = req.body;

    if (!name || !email || !phone || !message) {
      res.status(400).json({ success: false, message: "name, email, phone, and message are required" });
      return;
    }

    const msg = await Message.create({ name, email, phone, phoneVerified: phoneVerified === true, service: service || "", message });
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
    const limit = parseInt(req.query.limit as string) || 20;
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

    const apiKey  = process.env.MSG91_API_KEY;
    const widgetId = process.env.MSG91_WIDGET_ID;

    if (!apiKey || !widgetId) {
      console.warn("MSG91 keys not set — dev mode bypass");
      res.json({ success: true, devMode: true, reqId: "dev-req-id" });
      return;
    }

    // MSG91 Widget Send OTP API — no DLT, no template needed
    const response = await fetch("https://api.msg91.com/api/v5/widget/sendOtp", {
      method: "POST",
      headers: {
        "authkey": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        widgetId,
        identifier: `91${phone}`,
      }),
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

// POST /api/messages/verify-otp — Verify OTP via MSG91 Widget REST API
export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reqId, otp, token } = req.body;

    const apiKey  = process.env.MSG91_API_KEY;
    const widgetId = process.env.MSG91_WIDGET_ID;

    if (!apiKey || !widgetId) {
      // Dev mode — accept any 4-6 digit OTP
      const valid = /^\d{4,6}$/.test(otp || "");
      res.json({ success: valid, verified: valid, message: valid ? "Verified (dev mode)" : "Invalid OTP" });
      return;
    }

    // If we received a widget token (from browser widget fallback), verify it
    if (token && !reqId) {
      const verifyRes = await fetch(
        `https://api.msg91.com/api/v5/widget/verifyAccessToken?access-token=${token}`,
        { method: "GET", headers: { "authkey": apiKey } }
      );
      const data = await verifyRes.json();
      if (data.type === "success") {
        res.json({ success: true, verified: true });
      } else {
        res.status(400).json({ success: false, verified: false, message: "Token verification failed" });
      }
      return;
    }

    // Standard flow: verify OTP using reqId
    if (!reqId || !otp) {
      res.status(400).json({ success: false, message: "reqId and otp are required" });
      return;
    }

    const response = await fetch("https://api.msg91.com/api/v5/widget/verifyOtp", {
      method: "POST",
      headers: {
        "authkey": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({ widgetId, reqId, otp }),
    });

    const data = await response.json();
    console.log("MSG91 verifyOtp response:", data);

    if (data.type === "success" || data.message === "OTP verified successfully") {
      res.json({ success: true, verified: true });
    } else {
      res.status(400).json({ success: false, verified: false, message: data.message || "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "Failed to verify OTP" });
  }
};

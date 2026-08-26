import { Request, Response } from "express";
import Razorpay from "razorpay";
import Program from "../models/Program.js";
import { verifyRazorpaySignature } from "../utils/verifyRazorpaySignature.js";

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  });
};

// POST /api/payments/create-order
// Creates a Razorpay order using the server-authoritative price from the Program DB record.
// The client sends programId — the amount is NEVER trusted from the request body.
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { programId, currency = "INR", customerEmail } = req.body;

    if (!programId) {
      res.status(400).json({ success: false, message: "programId is required" });
      return;
    }

    // Look up the canonical price from the DB — attacker cannot supply an arbitrary amount
    const program = await Program.findById(programId).lean();
    if (!program) {
      res.status(400).json({ success: false, message: "Program not found" });
      return;
    }

    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
      amount: program.price,            // server-authoritative paise value from DB
      currency: program.currency || currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        programName:   program.name,
        customerEmail: customerEmail || "",
      },
    });

    res.json({
      success: true,
      data: {
        orderId:  order.id,
        amount:   order.amount,
        currency: order.currency,
        keyId:    process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ success: false, message: "Failed to create payment order" });
  }
};

// POST /api/payments/verify
// Verifies the Razorpay payment signature
export const verifyPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({ success: false, message: "Missing payment details" });
      return;
    }

    // Verify signature using shared util (timing-safe comparison, secret from env)
    const isAuthentic = verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET as string
    );

    if (isAuthentic) {
      res.json({
        success: true,
        message: "Payment verified successfully",
        data: {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Payment verification failed — signature mismatch",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

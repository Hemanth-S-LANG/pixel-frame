import { Request, Response } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";

// Initialize Razorpay instance
const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID as string,
    key_secret: process.env.RAZORPAY_KEY_SECRET as string,
  });
};

// POST /api/payments/create-order
// Creates a Razorpay order and returns the order details
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency = "INR", programName, customerEmail } = req.body;

    if (!amount) {
      res.status(400).json({ success: false, message: "Amount is required" });
      return;
    }

    const razorpay = getRazorpayInstance();

    const order = await razorpay.orders.create({
      amount: Math.round(amount), // amount in smallest currency unit (paise)
      currency,
      receipt: `receipt_${Date.now()}`,
      notes: {
        programName: programName || "",
        customerEmail: customerEmail || "",
      },
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
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

    // Generate the expected signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET as string)
      .update(body)
      .digest("hex");

    // Compare signatures
    const isAuthentic = expectedSignature === razorpay_signature;

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

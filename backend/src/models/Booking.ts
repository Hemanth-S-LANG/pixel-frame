import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  program: mongoose.Types.ObjectId;
  timeSlot: mongoose.Types.ObjectId;
  bookingDate: Date;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  bookingStatus: "confirmed" | "cancelled" | "completed";
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, trim: true, lowercase: true },
    customerPhone: { type: String, required: true, trim: true },
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    timeSlot: { type: Schema.Types.ObjectId, ref: "TimeSlot", required: true },
    bookingDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    razorpayOrderId:   { type: String, default: "" },
    razorpayPaymentId: { type: String, default: "" },
    razorpaySignature: { type: String, default: "" },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    bookingStatus: {
      type: String,
      enum: ["confirmed", "cancelled", "completed"],
      default: "confirmed",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

BookingSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });
BookingSchema.index({ customerEmail: 1 });
BookingSchema.index({ createdAt: -1 });

export default mongoose.model<IBooking>("Booking", BookingSchema);

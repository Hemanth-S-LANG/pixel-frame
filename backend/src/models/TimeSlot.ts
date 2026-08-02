import mongoose, { Schema, Document } from "mongoose";

export interface ITimeSlot extends Document {
  date: Date;
  startTime: string;
  endTime: string;
  program: mongoose.Types.ObjectId;
  isBooked: boolean;
  maxBookings: number;
  currentBookings: number;
  blockReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema = new Schema<ITimeSlot>(
  {
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true },   // e.g. "14:00"
    program: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    isBooked: { type: Boolean, default: false },
    maxBookings: { type: Number, default: 1 },
    currentBookings: { type: Number, default: 0 },
    blockReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate slots
TimeSlotSchema.index({ date: 1, startTime: 1 }, { unique: true });

// Index for program + date queries (getAvailableDates, getAvailableSlots)
TimeSlotSchema.index({ program: 1, date: 1 });

// Index for date-only queries (getBlockedDates, admin slots)
TimeSlotSchema.index({ date: 1 });

// Virtual to determine availability
TimeSlotSchema.virtual("isAvailable").get(function () {
  return this.currentBookings < this.maxBookings && !this.isBooked;
});

TimeSlotSchema.set("toJSON", { virtuals: true });
TimeSlotSchema.set("toObject", { virtuals: true });

export default mongoose.model<ITimeSlot>("TimeSlot", TimeSlotSchema);

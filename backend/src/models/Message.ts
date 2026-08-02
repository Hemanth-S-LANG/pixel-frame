import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  name: string;
  email: string;
  phone: string;
  phoneVerified: boolean;
  service: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    name:          { type: String, required: true, trim: true },
    email:         { type: String, required: true, trim: true, lowercase: true },
    phone:         { type: String, required: true, trim: true },
    phoneVerified: { type: Boolean, default: false },
    service:       { type: String, default: "" },
    message:       { type: String, required: true },
    isRead:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ createdAt: -1 });
MessageSchema.index({ isRead: 1 });

export default mongoose.model<IMessage>("Message", MessageSchema);

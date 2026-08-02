import mongoose, { Schema, Document } from "mongoose";

export interface IProgram extends Document {
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  category: "cinematography" | "photography" | "studio-rental" | "post-production";
  image: string;
  icon: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true }, // in smallest currency unit (paise/cents)
    currency: { type: String, default: "INR" },
    duration: { type: String, required: true },
    category: {
      type: String,
      enum: ["cinematography", "photography", "studio-rental", "post-production"],
      required: true,
    },
    image: { type: String, required: true },
    icon: { type: String, default: "Film" },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IProgram>("Program", ProgramSchema);

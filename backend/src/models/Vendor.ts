import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const VendorSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, unique: true, index: true },
    displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    storeSlug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 140, index: true },
    description: { type: String, maxlength: 2000 },
    logoUrl: { type: String },
    contactEmail: { type: String, lowercase: true, trim: true, maxlength: 160 },
    contactPhone: { type: String, trim: true, maxlength: 30 },
    address: {
      line1: { type: String, maxlength: 200 },
      line2: { type: String, maxlength: 200 },
      city: { type: String, maxlength: 120 },
      state: { type: String, maxlength: 120 },
      country: { type: String, maxlength: 120, default: "India" },
      pincode: { type: String, maxlength: 20 }
    },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    approvedAt: { type: Date },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

VendorSchema.index({ status: 1, createdAt: -1 });

export type VendorDoc = InferSchemaType<typeof VendorSchema>;
export const Vendor = mongoose.model<VendorDoc>("Vendor", VendorSchema);

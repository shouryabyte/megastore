import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const VendorVerificationSchema = new Schema(
  {
    vendorId: { type: ObjectId, ref: "Vendor", required: true, unique: true, index: true },
    documents: {
      type: [
        {
          label: { type: String, required: true, maxlength: 120 },
          url: { type: String, required: true },
          publicId: { type: String, required: true }
        }
      ],
      default: []
    },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewedBy: { type: ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    notes: { type: String, maxlength: 2000 }
  },
  { timestamps: true }
);

export type VendorVerificationDoc = InferSchemaType<typeof VendorVerificationSchema>;
export const VendorVerification = mongoose.model<VendorVerificationDoc>("VendorVerification", VendorVerificationSchema);


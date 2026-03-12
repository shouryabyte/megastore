import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const VendorRatingSchema = new Schema(
  {
    vendorId: { type: ObjectId, ref: "Vendor", required: true, index: true },
    customerId: { type: ObjectId, ref: "User", required: true, index: true },
    orderId: { type: ObjectId, ref: "Order", index: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    comment: { type: String, maxlength: 4000 }
  },
  { timestamps: true }
);

VendorRatingSchema.index({ vendorId: 1, customerId: 1, orderId: 1 }, { unique: true, sparse: true });
VendorRatingSchema.index({ vendorId: 1, createdAt: -1 });

export type VendorRatingDoc = InferSchemaType<typeof VendorRatingSchema>;
export const VendorRating = mongoose.model<VendorRatingDoc>("VendorRating", VendorRatingSchema);


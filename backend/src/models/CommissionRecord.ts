import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const CommissionRecordSchema = new Schema(
  {
    orderId: { type: ObjectId, ref: "Order", required: true, index: true },
    vendorId: { type: ObjectId, ref: "Vendor", required: true, index: true },
    rate: { type: Number, required: true, min: 0, max: 1 },
    amountVendor: { type: Number, required: true, min: 0 },
    amountCommission: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "payable", "paid", "reversed"], default: "pending", index: true },
    payoutRef: { type: String, maxlength: 120 }
  },
  { timestamps: true }
);

CommissionRecordSchema.index({ vendorId: 1, createdAt: -1 });

export type CommissionRecordDoc = InferSchemaType<typeof CommissionRecordSchema>;
export const CommissionRecord = mongoose.model<CommissionRecordDoc>("CommissionRecord", CommissionRecordSchema);


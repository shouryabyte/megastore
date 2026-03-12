import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const PaymentSchema = new Schema(
  {
    orderId: { type: ObjectId, ref: "Order", required: true, unique: true, index: true },
    customerId: { type: ObjectId, ref: "User", required: true, index: true },
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String, index: true },
    razorpaySignature: { type: String },
    status: { type: String, enum: ["created", "authorized", "captured", "failed", "refunded"], default: "created", index: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    method: { type: String },
    isTest: { type: Boolean, default: false, index: true },
    capturedAt: { type: Date }
  },
  { timestamps: true }
);

export type PaymentDoc = InferSchemaType<typeof PaymentSchema>;
export const Payment = mongoose.model<PaymentDoc>("Payment", PaymentSchema);

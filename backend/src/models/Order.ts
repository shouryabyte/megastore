import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const AddressSchema = new Schema(
  {
    fullName: { type: String, required: true, maxlength: 120 },
    phone: { type: String, required: true, maxlength: 30 },
    line1: { type: String, required: true, maxlength: 200 },
    line2: { type: String, maxlength: 200 },
    city: { type: String, required: true, maxlength: 120 },
    state: { type: String, required: true, maxlength: 120 },
    country: { type: String, required: true, maxlength: 120 },
    pincode: { type: String, required: true, maxlength: 20 }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    customerId: { type: ObjectId, ref: "User", required: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"],
      default: "placed",
      index: true
    },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending", index: true },
    itemsSubtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0, index: true },
    itemIds: { type: [ObjectId], ref: "OrderItem", default: [] },
    vendorIds: { type: [ObjectId], ref: "Vendor", default: [], index: true },
    commissionTotal: { type: Number, default: 0, min: 0 },
    shippingAddress: { type: AddressSchema, required: true },
    notes: { type: String, maxlength: 2000 },
    placedAt: { type: Date, default: () => new Date(), index: true }
  },
  { timestamps: true }
);

OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

export type OrderDoc = InferSchemaType<typeof OrderSchema>;
export const Order = mongoose.model<OrderDoc>("Order", OrderSchema);


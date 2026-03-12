import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const OrderItemSchema = new Schema(
  {
    orderId: { type: ObjectId, ref: "Order", required: true, index: true },
    productId: { type: ObjectId, ref: "Product", required: true, index: true },
    vendorId: { type: ObjectId, ref: "Vendor", required: true, index: true },
    titleSnapshot: { type: String, required: true, maxlength: 200 },
    skuSnapshot: { type: String, required: true, maxlength: 160 },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"],
      default: "placed",
      index: true
    }
  },
  { timestamps: true }
);

OrderItemSchema.index({ vendorId: 1, createdAt: -1 });

export type OrderItemDoc = InferSchemaType<typeof OrderItemSchema>;
export const OrderItem = mongoose.model<OrderItemDoc>("OrderItem", OrderItemSchema);

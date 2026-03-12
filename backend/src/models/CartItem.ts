import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const CartItemSchema = new Schema(
  {
    cartId: { type: ObjectId, ref: "Cart", required: true, index: true },
    productId: { type: ObjectId, ref: "Product", required: true, index: true },
    vendorId: { type: ObjectId, ref: "Vendor", required: true, index: true },
    quantity: { type: Number, required: true, min: 1 },
    priceSnapshot: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

CartItemSchema.index({ cartId: 1, productId: 1 }, { unique: true });

export type CartItemDoc = InferSchemaType<typeof CartItemSchema>;
export const CartItem = mongoose.model<CartItemDoc>("CartItem", CartItemSchema);


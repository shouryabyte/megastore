import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const CartSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, unique: true, index: true }
  },
  { timestamps: true }
);

export type CartDoc = InferSchemaType<typeof CartSchema>;
export const Cart = mongoose.model<CartDoc>("Cart", CartSchema);


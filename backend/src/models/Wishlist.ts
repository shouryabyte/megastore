import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const WishlistSchema = new Schema(
  {
    userId: { type: ObjectId, ref: "User", required: true, unique: true, index: true },
    productIds: { type: [ObjectId], ref: "Product", default: [] }
  },
  { timestamps: true }
);

export type WishlistDoc = InferSchemaType<typeof WishlistSchema>;
export const Wishlist = mongoose.model<WishlistDoc>("Wishlist", WishlistSchema);

import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const ReviewSchema = new Schema(
  {
    productId: { type: ObjectId, ref: "Product", required: true, index: true },
    customerId: { type: ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5, index: true },
    title: { type: String, maxlength: 120 },
    comment: { type: String, maxlength: 4000 }
  },
  { timestamps: true }
);

ReviewSchema.index({ productId: 1, customerId: 1 }, { unique: true });
ReviewSchema.index({ productId: 1, createdAt: -1 });

export type ReviewDoc = InferSchemaType<typeof ReviewSchema>;
export const Review = mongoose.model<ReviewDoc>("Review", ReviewSchema);


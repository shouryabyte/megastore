import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const ProductImageSchema = new Schema(
  {
    productId: { type: ObjectId, ref: "Product", required: true, index: true },
    vendorId: { type: ObjectId, ref: "Vendor", required: true, index: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true, index: true },
    alt: { type: String, maxlength: 180 },
    sortOrder: { type: Number, default: 0, index: true }
  },
  { timestamps: true }
);

ProductImageSchema.index({ productId: 1, sortOrder: 1 });

export type ProductImageDoc = InferSchemaType<typeof ProductImageSchema>;
export const ProductImage = mongoose.model<ProductImageDoc>("ProductImage", ProductImageSchema);


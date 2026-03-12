import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const BulkTierSchema = new Schema(
  {
    minQty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    vendorId: { type: ObjectId, ref: "Vendor", required: true, index: true },
    categoryId: { type: ObjectId, ref: "Category", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160, index: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 200, index: true },
    brand: { type: String, required: true, trim: true, maxlength: 120, index: true },
    modelNumber: { type: String, trim: true, maxlength: 160, index: true },
    description: { type: String, maxlength: 8000 },
    price: { type: Number, required: true, min: 0, index: true },
    mrp: { type: Number, min: 0 },
    bulkPricing: { type: [BulkTierSchema], default: [] },
    specs: { type: Map, of: String, default: {} },
    compatibility: { type: [String], default: [], index: true },
    tags: { type: [String], default: [], index: true },
    imageIds: { type: [ObjectId], ref: "ProductImage", default: [] },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
    sponsoredRank: { type: Number, default: 0, min: 0, index: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

ProductSchema.index({ title: "text", modelNumber: "text", brand: "text", "specs.$**": "text" });
ProductSchema.index({ vendorId: 1, isActive: 1, createdAt: -1 });
ProductSchema.index({ isFeatured: 1, sponsoredRank: -1, createdAt: -1 });

export type ProductDoc = InferSchemaType<typeof ProductSchema>;
export const Product = mongoose.model<ProductDoc>("Product", ProductSchema);

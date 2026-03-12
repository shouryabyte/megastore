import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 140, index: true },
    parentId: { type: ObjectId, ref: "Category" },
    icon: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

CategorySchema.index({ parentId: 1, sortOrder: 1 });

export type CategoryDoc = InferSchemaType<typeof CategorySchema>;
export const Category = mongoose.model<CategoryDoc>("Category", CategorySchema);

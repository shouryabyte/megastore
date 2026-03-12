import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const InventorySchema = new Schema(
  {
    productId: { type: ObjectId, ref: "Product", required: true, unique: true, index: true },
    vendorId: { type: ObjectId, ref: "Vendor", required: true, index: true },
    sku: { type: String, required: true, unique: true, trim: true, maxlength: 160, index: true },
    quantity: { type: Number, required: true, min: 0, index: true },
    reserved: { type: Number, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 }
  },
  { timestamps: true }
);

InventorySchema.index({ vendorId: 1, quantity: 1 });

export type InventoryDoc = InferSchemaType<typeof InventorySchema>;
export const Inventory = mongoose.model<InventoryDoc>("Inventory", InventorySchema);

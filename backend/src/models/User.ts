import mongoose, { Schema, type InferSchemaType } from "mongoose";
import type { RoleName } from "./Role.js";
import { ObjectId } from "./_shared.js";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 160 },
    phone: { type: String, trim: true, maxlength: 30 },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["Admin", "Vendor", "Customer"], index: true },
    vendorId: { type: ObjectId, ref: "Vendor", index: true },
    tokenVersion: { type: Number, default: 0 },
    refreshTokenHash: { type: String },
    refreshTokenExpiresAt: { type: Date },
    isBlocked: { type: Boolean, default: false, index: true }
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { role: RoleName };
export const User = mongoose.model<UserDoc>("User", UserSchema);

import mongoose, { Schema } from "mongoose";

export type RoleName = "Admin" | "Vendor" | "Customer";

export type RoleDoc = {
  name: RoleName;
  description?: string;
  permissions: string[];
};

const RoleSchema = new Schema<RoleDoc>(
  {
    name: { type: String, required: true, unique: true, enum: ["Admin", "Vendor", "Customer"] },
    description: { type: String },
    permissions: { type: [String], default: [] }
  },
  { timestamps: true }
);

RoleSchema.index({ name: 1 }, { unique: true });

export const Role = mongoose.model<RoleDoc>("Role", RoleSchema);

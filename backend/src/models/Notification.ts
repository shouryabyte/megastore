import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { ObjectId } from "./_shared.js";

const NotificationSchema = new Schema(
  {
    recipientUserId: { type: ObjectId, ref: "User", index: true },
    recipientVendorId: { type: ObjectId, ref: "Vendor", index: true },
    type: { type: String, required: true, maxlength: 80, index: true },
    title: { type: String, required: true, maxlength: 160 },
    message: { type: String, required: true, maxlength: 2000 },
    data: { type: Schema.Types.Mixed },
    readAt: { type: Date }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipientUserId: 1, createdAt: -1 });
NotificationSchema.index({ recipientVendorId: 1, createdAt: -1 });

export type NotificationDoc = InferSchemaType<typeof NotificationSchema>;
export const Notification = mongoose.model<NotificationDoc>("Notification", NotificationSchema);


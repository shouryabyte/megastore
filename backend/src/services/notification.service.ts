import { Notification } from "../models/Notification.js";
import { emitToUser, emitToVendor } from "../sockets/socketHub.js";

export async function notifyUser(userId: string, input: { type: string; title: string; message: string; data?: unknown }) {
  const doc = await Notification.create({ recipientUserId: userId, ...input });
  emitToUser(userId, "notify", { id: doc._id.toString(), ...input, createdAt: doc.createdAt });
  return doc;
}

export async function notifyVendor(vendorId: string, input: { type: string; title: string; message: string; data?: unknown }) {
  const doc = await Notification.create({ recipientVendorId: vendorId, ...input });
  emitToVendor(vendorId, "notify", { id: doc._id.toString(), ...input, createdAt: doc.createdAt });
  return doc;
}


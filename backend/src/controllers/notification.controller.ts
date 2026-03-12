import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Notification } from "../models/Notification.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import { AppError } from "../utils/errors.js";

export const listNotificationsHandler: RequestHandler = asyncHandler(async (req: AuthedRequest, res) => {
  if (!req.auth) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  const vendorId = req.auth.vendorId;
  const filter: any = vendorId ? { $or: [{ recipientUserId: req.auth.sub }, { recipientVendorId: vendorId }] } : { recipientUserId: req.auth.sub };
  const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  res.json({
    ok: true,
    items: items.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data,
      readAt: n.readAt,
      createdAt: n.createdAt
    }))
  });
});

export const markNotificationReadHandler: RequestHandler = asyncHandler(async (req: AuthedRequest, res) => {
  if (!req.auth) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  await Notification.updateOne({ _id: req.params.id }, { $set: { readAt: new Date() } });
  res.json({ ok: true });
});


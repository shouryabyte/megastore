import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Vendor } from "../models/Vendor.js";
import { User } from "../models/User.js";
import { VendorVerification } from "../models/VendorVerification.js";
import { AppError } from "../utils/errors.js";
import { adminOverview } from "../services/analytics.service.js";
import { notifyVendor } from "../services/notification.service.js";

export const adminOverviewHandler: RequestHandler = asyncHandler(async (_req, res) => {
  const data = await adminOverview();
  res.json({ ok: true, data });
});

export const listPendingVendorsHandler: RequestHandler = asyncHandler(async (_req, res) => {
  const items = await Vendor.find({ status: "pending" }).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ ok: true, items });
});

export const approveVendorHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const vendor = await Vendor.findById(req.params.vendorId);
  if (!vendor) throw new AppError("Vendor not found", 404, "NOT_FOUND");
  vendor.status = "approved";
  vendor.approvedAt = new Date();
  await vendor.save();
  await notifyVendor(vendor._id.toString(), {
    type: "VENDOR_APPROVED",
    title: "Vendor approved",
    message: "Your vendor account has been approved. You can now list products."
  });
  res.json({ ok: true });
});

export const rejectVendorHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const vendor = await Vendor.findById(req.params.vendorId);
  if (!vendor) throw new AppError("Vendor not found", 404, "NOT_FOUND");
  vendor.status = "rejected";
  await vendor.save();
  await notifyVendor(vendor._id.toString(), { type: "VENDOR_REJECTED", title: "Vendor rejected", message: "Your vendor account was rejected. Contact support." });
  res.json({ ok: true });
});

export const blockUserHandler: RequestHandler = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.userId, {
    $set: { isBlocked: true },
    $inc: { tokenVersion: 1 },
    $unset: { refreshTokenHash: 1, refreshTokenExpiresAt: 1 }
  });
  res.json({ ok: true });
});

export const listVendorVerificationsHandler: RequestHandler = asyncHandler(async (_req, res) => {
  const items = await VendorVerification.find({}).sort({ createdAt: -1 }).limit(200).lean();
  res.json({ ok: true, items });
});


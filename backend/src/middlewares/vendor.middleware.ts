import type { RequestHandler } from "express";
import { AppError } from "../utils/errors.js";
import { Vendor } from "../models/Vendor.js";
import type { AuthedRequest } from "./auth.middleware.js";

export const requireVendorApproved: RequestHandler = async (req: AuthedRequest, _res, next) => {
  const vendorId = req.auth?.vendorId;
  if (!vendorId) return next(new AppError("Vendor account required", 403, "FORBIDDEN"));
  if (!/^[a-fA-F0-9]{24}$/.test(vendorId)) return next(new AppError("Vendor account required", 403, "FORBIDDEN"));
  const vendor = await Vendor.findById(vendorId).select("status").lean();
  if (!vendor) return next(new AppError("Vendor not found", 404, "NOT_FOUND"));
  if (vendor.status !== "approved") return next(new AppError("Vendor approval pending", 403, "VENDOR_NOT_APPROVED"));
  next();
};

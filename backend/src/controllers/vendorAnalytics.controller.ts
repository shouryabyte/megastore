import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { vendorOverview } from "../services/analytics.service.js";

export const vendorOverviewHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const vendorId = req.auth?.vendorId;
  if (!vendorId) throw new AppError("Forbidden", 403, "FORBIDDEN");
  const data = await vendorOverview(vendorId);
  res.json({ ok: true, data });
});


import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Vendor } from "../models/Vendor.js";
import { AppError } from "../utils/errors.js";
import { User } from "../models/User.js";

const ListSchema = z.object({
  query: z.object({
    status: z.enum(["pending", "approved", "rejected"]).optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional()
  })
});

export const adminListVendorsHandler: RequestHandler[] = [
  validate(ListSchema),
  asyncHandler(async (req: any, res) => {
    const page = Math.max(1, req.validated.query.page ?? 1);
    const limit = Math.min(100, Math.max(1, req.validated.query.limit ?? 30));
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (req.validated.query.status) filter.status = req.validated.query.status;

    const [items, total] = await Promise.all([
      Vendor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Vendor.countDocuments(filter)
    ]);
    res.json({
      ok: true,
      page,
      limit,
      total,
      items: items.map((v) => ({
        id: v._id.toString(),
        userId: v.userId.toString(),
        displayName: v.displayName,
        storeSlug: v.storeSlug,
        status: v.status,
        ratingAvg: v.ratingAvg,
        ratingCount: v.ratingCount,
        createdAt: v.createdAt
      }))
    });
  })
];

export const adminGetVendorHandler: RequestHandler = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findById(req.params.vendorId).lean();
  if (!vendor) throw new AppError("Vendor not found", 404, "NOT_FOUND");
  const user = await User.findById(vendor.userId).select("_id name email isBlocked createdAt").lean();
  res.json({
    ok: true,
    vendor: {
      id: vendor._id.toString(),
      user: user ? { id: user._id.toString(), name: user.name, email: user.email, isBlocked: user.isBlocked, createdAt: user.createdAt } : null,
      displayName: vendor.displayName,
      storeSlug: vendor.storeSlug,
      description: vendor.description,
      status: vendor.status,
      approvedAt: vendor.approvedAt,
      ratingAvg: vendor.ratingAvg,
      ratingCount: vendor.ratingCount,
      logoUrl: vendor.logoUrl,
      contactEmail: vendor.contactEmail,
      contactPhone: vendor.contactPhone,
      address: vendor.address,
      createdAt: vendor.createdAt
    }
  });
});


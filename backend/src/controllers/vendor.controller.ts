import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Vendor } from "../models/Vendor.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/errors.js";

export const getStorefrontHandler: RequestHandler = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ storeSlug: req.params.slug, status: "approved" }).lean();
  if (!vendor) throw new AppError("Vendor not found", 404, "NOT_FOUND");
  const products = await Product.find({ vendorId: vendor._id, isActive: true }).sort({ createdAt: -1 }).limit(48).populate("imageIds").lean();
  res.json({
    ok: true,
    vendor: { id: vendor._id.toString(), displayName: vendor.displayName, storeSlug: vendor.storeSlug, description: vendor.description, ratingAvg: vendor.ratingAvg, ratingCount: vendor.ratingCount, logoUrl: vendor.logoUrl },
    products: products.map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      price: p.price,
      mrp: p.mrp,
      brand: p.brand,
      images: (p.imageIds ?? []).filter(Boolean).map((img: any) => ({ id: img._id.toString(), url: img.url, alt: img.alt, sortOrder: img.sortOrder }))
    }))
  });
});

const UpdateProfileSchema = z.object({
  body: z.object({
    displayName: z.string().min(2).max(120).optional(),
    description: z.string().max(2000).optional(),
    contactEmail: z.string().email().max(160).optional(),
    contactPhone: z.string().max(30).optional(),
    logoUrl: z.string().url().optional()
  })
});

export const updateMyVendorProfileHandler: RequestHandler[] = [
  validate(UpdateProfileSchema),
  asyncHandler(async (req: any, res) => {
    const vendorId = req.auth?.vendorId;
    if (!vendorId) throw new AppError("Forbidden", 403, "FORBIDDEN");
    const patch = req.validated.body;
    const vendor = await Vendor.findByIdAndUpdate(vendorId, { $set: patch }, { new: true }).lean();
    res.json({ ok: true, vendor });
  })
];

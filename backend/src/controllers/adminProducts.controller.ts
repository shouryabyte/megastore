import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Product } from "../models/Product.js";
import { Vendor } from "../models/Vendor.js";
import { Inventory } from "../models/Inventory.js";
import { AppError } from "../utils/errors.js";

const ListSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    vendor: z.string().optional(),
    category: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    isFeatured: z.coerce.boolean().optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional()
  })
});

export const adminListProductsHandler: RequestHandler[] = [
  validate(ListSchema),
  asyncHandler(async (req: any, res) => {
    const page = Math.max(1, req.validated.query.page ?? 1);
    const limit = Math.min(100, Math.max(1, req.validated.query.limit ?? 30));
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (req.validated.query.q) filter.$text = { $search: req.validated.query.q };
    if (req.validated.query.vendor) filter.vendorId = req.validated.query.vendor;
    if (req.validated.query.category) filter.categoryId = req.validated.query.category;
    if (typeof req.validated.query.isActive === "boolean") filter.isActive = req.validated.query.isActive;
    if (typeof req.validated.query.isFeatured === "boolean") filter.isFeatured = req.validated.query.isFeatured;

    const [items, total] = await Promise.all([
      Product.find(filter)
        .sort(req.validated.query.q ? ({ score: { $meta: "textScore" } } as any) : ({ createdAt: -1 } as any))
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter)
    ]);

    const vendorIds = Array.from(new Set(items.map((p) => p.vendorId.toString())));
    const vendors = await Vendor.find({ _id: { $in: vendorIds } }).select("displayName storeSlug status").lean();
    const vendorMap = new Map(vendors.map((v) => [v._id.toString(), v]));
    const inv = await Inventory.find({ productId: { $in: items.map((p) => p._id) } }).select("productId sku quantity lowStockThreshold").lean();
    const invMap = new Map(inv.map((i) => [i.productId.toString(), i]));

    res.json({
      ok: true,
      page,
      limit,
      total,
      items: items.map((p: any) => ({
        id: p._id.toString(),
        title: p.title,
        slug: p.slug,
        brand: p.brand,
        price: p.price,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        sponsoredRank: p.sponsoredRank ?? 0,
        vendor: vendorMap.get(p.vendorId.toString())
          ? {
              id: p.vendorId.toString(),
              displayName: vendorMap.get(p.vendorId.toString())!.displayName,
              storeSlug: vendorMap.get(p.vendorId.toString())!.storeSlug,
              status: vendorMap.get(p.vendorId.toString())!.status
            }
          : null,
        inventory: invMap.get(p._id.toString())
          ? {
              sku: invMap.get(p._id.toString())!.sku,
              quantity: invMap.get(p._id.toString())!.quantity,
              lowStockThreshold: invMap.get(p._id.toString())!.lowStockThreshold
            }
          : null
      }))
    });
  })
];

const PatchSchema = z.object({
  body: z.object({
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    sponsoredRank: z.number().int().min(0).max(1000).optional()
  })
});

export const adminPatchProductHandler: RequestHandler[] = [
  validate(PatchSchema),
  asyncHandler(async (req: any, res) => {
    const patch = req.validated.body;
    const product = await Product.findByIdAndUpdate(req.params.productId, { $set: patch }, { new: true }).lean();
    if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
    res.json({ ok: true });
  })
];

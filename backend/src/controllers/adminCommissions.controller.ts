import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { CommissionRecord } from "../models/CommissionRecord.js";
import { AppError } from "../utils/errors.js";

const ListSchema = z.object({
  query: z.object({
    vendorId: z.string().optional(),
    status: z.enum(["pending", "payable", "paid", "reversed"]).optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional()
  })
});

export const adminListCommissionsHandler: RequestHandler[] = [
  validate(ListSchema),
  asyncHandler(async (req: any, res) => {
    const page = Math.max(1, req.validated.query.page ?? 1);
    const limit = Math.min(100, Math.max(1, req.validated.query.limit ?? 30));
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (req.validated.query.vendorId) filter.vendorId = req.validated.query.vendorId;
    if (req.validated.query.status) filter.status = req.validated.query.status;

    const [items, total] = await Promise.all([
      CommissionRecord.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      CommissionRecord.countDocuments(filter)
    ]);
    res.json({
      ok: true,
      page,
      limit,
      total,
      items: items.map((c) => ({
        id: c._id.toString(),
        orderId: c.orderId.toString(),
        vendorId: c.vendorId.toString(),
        rate: c.rate,
        amountVendor: c.amountVendor,
        amountCommission: c.amountCommission,
        status: c.status,
        payoutRef: c.payoutRef ?? null,
        createdAt: c.createdAt
      }))
    });
  })
];

const PatchSchema = z.object({
  body: z.object({
    status: z.enum(["pending", "payable", "paid", "reversed"]).optional(),
    payoutRef: z.string().max(120).optional()
  })
});

export const adminPatchCommissionHandler: RequestHandler[] = [
  validate(PatchSchema),
  asyncHandler(async (req: any, res) => {
    const doc = await CommissionRecord.findByIdAndUpdate(req.params.commissionId, { $set: req.validated.body }, { new: true }).lean();
    if (!doc) throw new AppError("Commission record not found", 404, "NOT_FOUND");
    res.json({ ok: true });
  })
];

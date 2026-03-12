import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";

const ListSchema = z.object({
  query: z.object({
    role: z.enum(["Admin", "Vendor", "Customer"]).optional(),
    blocked: z.coerce.boolean().optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional()
  })
});

export const adminListUsersHandler: RequestHandler[] = [
  validate(ListSchema),
  asyncHandler(async (req: any, res) => {
    const page = Math.max(1, req.validated.query.page ?? 1);
    const limit = Math.min(100, Math.max(1, req.validated.query.limit ?? 30));
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (req.validated.query.role) filter.role = req.validated.query.role;
    if (typeof req.validated.query.blocked === "boolean") filter.isBlocked = req.validated.query.blocked;

    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select("_id name email role vendorId isBlocked createdAt").lean(),
      User.countDocuments(filter)
    ]);

    res.json({
      ok: true,
      page,
      limit,
      total,
      items: items.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        vendorId: u.vendorId?.toString() ?? null,
        isBlocked: u.isBlocked,
        createdAt: u.createdAt
      }))
    });
  })
];

export const adminUnblockUserHandler: RequestHandler = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.userId, { $set: { isBlocked: false } });
  res.json({ ok: true });
});


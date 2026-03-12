import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Category } from "../models/Category.js";
import { AppError } from "../utils/errors.js";

const PatchSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    icon: z.string().max(200).optional(),
    sortOrder: z.number().int().min(0).max(10_000).optional(),
    isActive: z.boolean().optional()
  })
});

export const adminPatchCategoryHandler: RequestHandler[] = [
  validate(PatchSchema),
  asyncHandler(async (req: any, res) => {
    const doc = await Category.findByIdAndUpdate(req.params.categoryId, { $set: req.validated.body }, { new: true }).lean();
    if (!doc) throw new AppError("Category not found", 404, "NOT_FOUND");
    res.json({ ok: true });
  })
];


import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Category } from "../models/Category.js";
import { slugify } from "../utils/slug.js";

export const listCategoriesHandler: RequestHandler = asyncHandler(async (_req, res) => {
  const items = await Category.find({ isActive: true }).sort({ parentId: 1, sortOrder: 1, name: 1 }).lean();
  res.json({ ok: true, items: items.map((c) => ({ id: c._id.toString(), name: c.name, slug: c.slug, parentId: c.parentId?.toString() ?? null, icon: c.icon, sortOrder: c.sortOrder })) });
});

const CreateSchema = z.object({ body: z.object({ name: z.string().min(2).max(120), parentId: z.string().optional(), icon: z.string().optional(), sortOrder: z.number().optional() }) });

export const createCategoryHandler: RequestHandler[] = [
  validate(CreateSchema),
  asyncHandler(async (req: any, res) => {
    const { name, parentId, icon, sortOrder } = req.validated.body;
    const slug = `${slugify(name)}-${Date.now().toString(36)}`;
    const cat = await Category.create({ name, slug, parentId, icon, sortOrder: sortOrder ?? 0, isActive: true });
    res.status(201).json({ ok: true, id: cat._id.toString() });
  })
];


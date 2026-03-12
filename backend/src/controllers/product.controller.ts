import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { listProducts, getProductBySlug, listFeaturedProducts, listLatestProducts } from "../services/product.service.js";

const ListSchema = z.object({
  query: z.object({
    q: z.string().optional(),
    category: z.string().optional(),
    vendor: z.string().optional(),
    brand: z.string().optional(),
    compatibility: z.string().optional(),
    minPrice: z.coerce.number().optional(),
    maxPrice: z.coerce.number().optional(),
    spec: z.union([z.string(), z.array(z.string())]).optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional()
  })
});

export const listProductsHandler: RequestHandler[] = [
  validate(ListSchema),
  asyncHandler(async (req: any, res) => {
    const specParam = req.validated.query.spec;
    const specs = parseSpecs(specParam);
    const result = await listProducts({ ...req.validated.query, specs });
    res.json({ ok: true, ...result });
  })
];

function parseSpecs(spec: unknown): Record<string, string> | undefined {
  if (!spec) return undefined;
  const arr = Array.isArray(spec) ? spec : [spec];
  const out: Record<string, string> = {};
  for (const s of arr) {
    if (typeof s !== "string") continue;
    const idx = s.indexOf(":");
    if (idx <= 0) continue;
    const k = s.slice(0, idx).trim();
    const v = s.slice(idx + 1).trim();
    if (!k || !v) continue;
    out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

export const getProductHandler: RequestHandler = asyncHandler(async (req, res) => {
  const product = await getProductBySlug(req.params.slug);
  res.json({ ok: true, product });
});

const HomeListSchema = z.object({
  query: z.object({
    limit: z.coerce.number().optional()
  })
});

export const featuredProductsHandler: RequestHandler[] = [
  validate(HomeListSchema),
  asyncHandler(async (req: any, res) => {
    const limit = Math.min(48, Math.max(1, req.validated.query.limit ?? 12));
    const items = await listFeaturedProducts(limit);
    res.json({ ok: true, items });
  })
];

export const latestProductsHandler: RequestHandler[] = [
  validate(HomeListSchema),
  asyncHandler(async (req: any, res) => {
    const limit = Math.min(48, Math.max(1, req.validated.query.limit ?? 12));
    const items = await listLatestProducts(limit);
    res.json({ ok: true, items });
  })
];

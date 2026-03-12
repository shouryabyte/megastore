import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";

const ListSchema = z.object({
  query: z.object({
    productId: z.string().optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional()
  })
});

export const adminListReviewsHandler: RequestHandler[] = [
  validate(ListSchema),
  asyncHandler(async (req: any, res) => {
    const page = Math.max(1, req.validated.query.page ?? 1);
    const limit = Math.min(100, Math.max(1, req.validated.query.limit ?? 30));
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (req.validated.query.productId) filter.productId = req.validated.query.productId;

    const [items, total] = await Promise.all([
      Review.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("customerId", "name email").lean(),
      Review.countDocuments(filter)
    ]);
    res.json({
      ok: true,
      page,
      limit,
      total,
      items: items.map((r: any) => ({
        id: r._id.toString(),
        productId: r.productId.toString(),
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        customer: r.customerId ? { id: r.customerId._id.toString(), name: r.customerId.name, email: r.customerId.email } : null,
        createdAt: r.createdAt
      }))
    });
  })
];

export const adminDeleteReviewHandler: RequestHandler = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId).lean();
  if (!review) return res.json({ ok: true });
  await Review.deleteOne({ _id: review._id });
  const agg = await Review.aggregate([{ $match: { productId: review.productId } }, { $group: { _id: "$productId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }]);
  await Product.findByIdAndUpdate(review.productId, { $set: { ratingAvg: agg[0]?.avg ?? 0, ratingCount: agg[0]?.count ?? 0 } });
  res.json({ ok: true });
});


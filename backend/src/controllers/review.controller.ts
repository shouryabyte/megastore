import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Review } from "../models/Review.js";
import { Product } from "../models/Product.js";

const CreateSchema = z.object({
  body: z.object({
    productId: z.string().min(1),
    rating: z.number().int().min(1).max(5),
    title: z.string().max(120).optional(),
    comment: z.string().max(4000).optional()
  })
});

export const createReviewHandler: RequestHandler[] = [
  validate(CreateSchema),
  asyncHandler(async (req: any, res) => {
    const { productId, rating, title, comment } = req.validated.body;
    const review = await Review.findOneAndUpdate(
      { productId, customerId: req.auth.sub },
      { $set: { rating, title, comment } },
      { upsert: true, new: true }
    );
    const agg = await Review.aggregate([{ $match: { productId: review.productId } }, { $group: { _id: "$productId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }]);
    await Product.findByIdAndUpdate(productId, { $set: { ratingAvg: agg[0]?.avg ?? 0, ratingCount: agg[0]?.count ?? 0 } });
    res.status(201).json({ ok: true, id: review._id.toString() });
  })
];

export const listProductReviewsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const items = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 }).limit(50).populate("customerId", "name").lean();
  res.json({
    ok: true,
    items: items.map((r: any) => ({
      id: r._id.toString(),
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      customer: r.customerId ? { id: r.customerId._id.toString(), name: r.customerId.name } : null,
      createdAt: r.createdAt
    }))
  });
});


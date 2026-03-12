import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { VendorRating } from "../models/VendorRating.js";
import { Vendor } from "../models/Vendor.js";
import { OrderItem } from "../models/OrderItem.js";
import { Order } from "../models/Order.js";

const CreateSchema = z.object({
  body: z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(4000).optional()
  })
});

export const rateVendorHandler: RequestHandler[] = [
  validate(CreateSchema),
  asyncHandler(async (req: any, res) => {
    const customerId = req.auth?.sub;
    if (!customerId) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    const vendorId = req.params.vendorId;

    // Require at least one purchased item from this vendor.
    const orderIds = await Order.distinct("_id", { customerId, paymentStatus: "paid" });
    const hasPurchase = await OrderItem.exists({ vendorId, orderId: { $in: orderIds } });
    if (!hasPurchase) throw new AppError("You can rate only after purchase", 403, "RATING_REQUIRES_PURCHASE");

    const doc = await VendorRating.findOneAndUpdate(
      { vendorId, customerId },
      { $set: { rating: req.validated.body.rating, comment: req.validated.body.comment } },
      { upsert: true, new: true }
    );

    const agg = await VendorRating.aggregate([{ $match: { vendorId: doc.vendorId } }, { $group: { _id: "$vendorId", avg: { $avg: "$rating" }, count: { $sum: 1 } } }]);
    await Vendor.findByIdAndUpdate(vendorId, { $set: { ratingAvg: agg[0]?.avg ?? 0, ratingCount: agg[0]?.count ?? 0 } });

    res.status(201).json({ ok: true, id: doc._id.toString() });
  })
];

export const listVendorRatingsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const items = await VendorRating.find({ vendorId: req.params.vendorId }).sort({ createdAt: -1 }).limit(50).populate("customerId", "name").lean();
  res.json({
    ok: true,
    items: items.map((r: any) => ({
      id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      customer: r.customerId ? { id: r.customerId._id.toString(), name: r.customerId.name } : null,
      createdAt: r.createdAt
    }))
  });
});

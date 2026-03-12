import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/errors.js";
import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";

export const getVendorOrderHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const vendorId = req.auth?.vendorId;
  if (!vendorId) throw new AppError("Forbidden", 403, "FORBIDDEN");
  const order = await Order.findById(req.params.orderId).lean();
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");
  const items = await OrderItem.find({ orderId: order._id, vendorId }).lean();
  if (!items.length) throw new AppError("Order not found", 404, "NOT_FOUND");
  const vendorTotal = items.reduce((s, it) => s + (it.totalPrice ?? 0), 0);
  res.json({
    ok: true,
    order: {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      vendorTotal,
      placedAt: order.placedAt,
      shippingAddress: order.shippingAddress,
      items: items.map((i) => ({
        id: i._id.toString(),
        productId: i.productId.toString(),
        titleSnapshot: i.titleSnapshot,
        skuSnapshot: i.skuSnapshot,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        status: i.status
      }))
    }
  });
});

const UpdateItemSchema = z.object({
  body: z.object({
    status: z.enum(["packed", "shipped", "delivered", "cancelled"])
  })
});

const ORDER_PROGRESS = ["placed", "confirmed", "packed", "shipped", "delivered"] as const;
function rank(status: string) {
  const idx = ORDER_PROGRESS.indexOf(status as any);
  return idx === -1 ? -1 : idx;
}

export const updateVendorOrderItemStatusHandler: RequestHandler[] = [
  validate(UpdateItemSchema),
  asyncHandler(async (req: any, res) => {
    const vendorId = req.auth?.vendorId;
    if (!vendorId) throw new AppError("Forbidden", 403, "FORBIDDEN");
    const { status } = req.validated.body;

    const item = await OrderItem.findOne({ _id: req.params.itemId, orderId: req.params.orderId, vendorId });
    if (!item) throw new AppError("Order item not found", 404, "NOT_FOUND");

    // Prevent regression for normal progression statuses.
    if (status !== "cancelled" && rank(item.status) > rank(status)) {
      throw new AppError("Invalid status transition", 400, "INVALID_STATUS_TRANSITION");
    }
    item.status = status as any;
    await item.save();

    // Recompute overall order status from all items.
    const all = await OrderItem.find({ orderId: item.orderId }).select("status").lean();
    const statuses = all.map((a) => a.status);
    const order = await Order.findById(item.orderId);
    if (order) {
      const allDelivered = statuses.every((s) => s === "delivered");
      const allShippedOrMore = statuses.every((s) => s === "shipped" || s === "delivered");
      const allPackedOrMore = statuses.every((s) => s === "packed" || s === "shipped" || s === "delivered");

      if (allDelivered) order.status = "delivered";
      else if (allShippedOrMore) order.status = "shipped";
      else if (allPackedOrMore) order.status = "packed";
      else if (order.paymentStatus === "paid") order.status = "confirmed";
      else order.status = "placed";

      await order.save();
    }

    res.json({ ok: true });
  })
];

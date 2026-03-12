import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { AppError } from "../utils/errors.js";

const ListSchema = z.object({
  query: z.object({
    status: z.string().optional(),
    paymentStatus: z.string().optional(),
    page: z.coerce.number().optional(),
    limit: z.coerce.number().optional()
  })
});

export const adminListOrdersHandler: RequestHandler[] = [
  validate(ListSchema),
  asyncHandler(async (req: any, res) => {
    const page = Math.max(1, req.validated.query.page ?? 1);
    const limit = Math.min(100, Math.max(1, req.validated.query.limit ?? 30));
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (req.validated.query.status) filter.status = req.validated.query.status;
    if (req.validated.query.paymentStatus) filter.paymentStatus = req.validated.query.paymentStatus;

    const [items, total] = await Promise.all([Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Order.countDocuments(filter)]);

    res.json({
      ok: true,
      page,
      limit,
      total,
      items: items.map((o) => ({
        id: o._id.toString(),
        orderNumber: o.orderNumber,
        customerId: o.customerId.toString(),
        status: o.status,
        paymentStatus: o.paymentStatus,
        total: o.total,
        placedAt: o.placedAt,
        vendorIds: o.vendorIds.map((v) => v.toString())
      }))
    });
  })
];

export const adminGetOrderHandler: RequestHandler = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.orderId).lean();
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");
  const items = await OrderItem.find({ orderId: order._id }).lean();
  res.json({
    ok: true,
    order: {
      id: order._id.toString(),
      orderNumber: order.orderNumber,
      customerId: order.customerId.toString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      itemsSubtotal: order.itemsSubtotal,
      shippingFee: order.shippingFee,
      tax: order.tax,
      total: order.total,
      commissionTotal: order.commissionTotal,
      vendorIds: order.vendorIds.map((v) => v.toString()),
      shippingAddress: order.shippingAddress,
      placedAt: order.placedAt,
      items: items.map((i) => ({
        id: i._id.toString(),
        productId: i.productId.toString(),
        vendorId: i.vendorId.toString(),
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


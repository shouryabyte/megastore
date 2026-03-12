import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createOrderFromCart, getOrder, listMyOrders, listVendorOrders } from "../services/order.service.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import { AppError } from "../utils/errors.js";
import { generateInvoicePdf } from "../utils/invoice.js";
import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { Inventory } from "../models/Inventory.js";
import { Vendor } from "../models/Vendor.js";

const CreateSchema = z.object({
  body: z.object({
    shippingAddress: z.object({
      fullName: z.string().min(2).max(120),
      phone: z.string().min(6).max(30),
      line1: z.string().min(2).max(200),
      line2: z.string().max(200).optional(),
      city: z.string().min(2).max(120),
      state: z.string().min(2).max(120),
      country: z.string().min(2).max(120),
      pincode: z.string().min(3).max(20)
    }),
    notes: z.string().max(2000).optional()
  })
});

export const createOrderHandler: RequestHandler[] = [
  validate(CreateSchema),
  asyncHandler(async (req: any, res) => {
    const order = await createOrderFromCart(req.auth.sub, req.validated.body);
    res.status(201).json({ ok: true, order });
  })
];

export const listMyOrdersHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await listMyOrders(req.auth.sub, page, limit);
  res.json({ ok: true, ...result });
});

export const getMyOrderHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const order = await getOrder(req.auth.sub, req.params.id);
  res.json({ ok: true, order });
});

export const listVendorOrdersHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const vendorId = req.auth?.vendorId;
  if (!vendorId) throw new AppError("Forbidden", 403, "FORBIDDEN");
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const result = await listVendorOrders(vendorId, page, limit);
  res.json({ ok: true, ...result });
});

export const downloadInvoiceHandler: RequestHandler = asyncHandler(async (req: AuthedRequest, res) => {
  if (!req.auth) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  const order = await Order.findOne({ _id: req.params.id, customerId: req.auth.sub }).lean();
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");
  const items = await OrderItem.find({ orderId: order._id }).lean();
  const vendors = await Vendor.find({ _id: { $in: order.vendorIds } }).select("displayName storeSlug").lean();
  const inventory = await Inventory.find({ productId: { $in: items.map((i) => i.productId) } }).select("productId sku").lean();
  const pdf = await generateInvoicePdf({ order, items, vendors, inventory });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=\"invoice-${order.orderNumber}.pdf\"`);
  res.send(pdf);
});


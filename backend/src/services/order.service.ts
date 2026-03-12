import mongoose from "mongoose";
import { nanoid } from "nanoid/non-secure";
import { Cart } from "../models/Cart.js";
import { CartItem } from "../models/CartItem.js";
import { Inventory } from "../models/Inventory.js";
import { Product } from "../models/Product.js";
import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { CommissionRecord } from "../models/CommissionRecord.js";
import { Vendor } from "../models/Vendor.js";
import { AppError } from "../utils/errors.js";
import { round2 } from "../utils/numbers.js";
import { emitGlobal, emitToVendor } from "../sockets/socketHub.js";
import { notifyUser, notifyVendor } from "./notification.service.js";

export const DEFAULT_COMMISSION_RATE = 0.08;

export async function createOrderFromCart(userId: string, input: { shippingAddress: any; notes?: string }) {
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart) throw new AppError("Cart is empty", 400, "CART_EMPTY");
  const cartItems = await CartItem.find({ cartId: cart._id }).lean();
  if (!cartItems.length) throw new AppError("Cart is empty", 400, "CART_EMPTY");

  const productIds = cartItems.map((c) => c.productId.toString());
  const products = await Product.find({ _id: { $in: productIds }, isActive: true }).lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const inventories = await Inventory.find({ productId: { $in: productIds } }).lean();
  const invMap = new Map(inventories.map((i) => [i.productId.toString(), i]));

  // Enforce that only approved vendors can sell items in an order.
  const vendorIds = Array.from(new Set(products.map((p) => p.vendorId.toString())));
  const vendors = await Vendor.find({ _id: { $in: vendorIds }, status: "approved" }).select("_id").lean();
  const approvedVendorSet = new Set(vendors.map((v) => v._id.toString()));

  const items = cartItems.map((ci) => {
    const product = productMap.get(ci.productId.toString());
    if (!product) throw new AppError("Product not found", 404, "NOT_FOUND", { productId: ci.productId.toString() });
    if (!approvedVendorSet.has(product.vendorId.toString())) throw new AppError("Vendor not approved for sale", 400, "VENDOR_NOT_APPROVED_FOR_ORDER");
    const inv = invMap.get(ci.productId.toString());
    if (!inv) throw new AppError("Inventory not found", 404, "NOT_FOUND", { productId: ci.productId.toString() });
    if (inv.quantity < ci.quantity) throw new AppError("Insufficient stock", 400, "INSUFFICIENT_STOCK", { productId: ci.productId.toString() });
    return {
      productId: ci.productId.toString(),
      vendorId: product.vendorId.toString(),
      titleSnapshot: product.title,
      skuSnapshot: inv.sku,
      quantity: ci.quantity,
      unitPrice: product.price,
      totalPrice: round2(product.price * ci.quantity)
    };
  });

  const itemsSubtotal = round2(items.reduce((sum, it) => sum + it.totalPrice, 0));
  const shippingFee = round2(itemsSubtotal > 999 ? 0 : 49);
  const tax = round2(itemsSubtotal * 0.18);
  const total = round2(itemsSubtotal + shippingFee + tax);
  const orderNumber = `NX-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${nanoid(8).toUpperCase()}`;

  const session = await mongoose.startSession();
  try {
    let orderId = "";
    let vendorIds: string[] = [];
    const postCommitInventory: { productId: string; vendorId: string; quantity: number; lowStockThreshold: number }[] = [];
    await session.withTransaction(async () => {
      for (const it of items) {
        const inv = await Inventory.findOne({ productId: it.productId }).session(session);
        if (!inv) throw new AppError("Inventory not found", 404, "NOT_FOUND");
        if (inv.quantity < it.quantity) throw new AppError("Insufficient stock", 400, "INSUFFICIENT_STOCK", { productId: it.productId });
        inv.quantity -= it.quantity;
        await inv.save({ session });
        postCommitInventory.push({
          productId: it.productId,
          vendorId: inv.vendorId.toString(),
          quantity: inv.quantity,
          lowStockThreshold: inv.lowStockThreshold
        });
      }

      const order = await Order.create(
        [
          {
            customerId: userId,
            orderNumber,
            itemsSubtotal,
            shippingFee,
            tax,
            total,
            shippingAddress: input.shippingAddress,
            notes: input.notes,
            vendorIds: Array.from(new Set(items.map((i) => i.vendorId))),
            status: "placed",
            paymentStatus: "pending"
          }
        ],
        { session }
      );
      orderId = order[0]._id.toString();
      vendorIds = order[0].vendorIds.map((v) => v.toString());

      const createdItems = await OrderItem.insertMany(
        items.map((it) => ({ ...it, orderId, status: "placed" })),
        { session }
      );
      await Order.updateOne({ _id: orderId }, { $set: { itemIds: createdItems.map((i) => i._id) } }, { session });

      const commissionRecords = aggregateCommissions(items, DEFAULT_COMMISSION_RATE);
      const totalCommission = round2(commissionRecords.reduce((s, r) => s + r.amountCommission, 0));
      await CommissionRecord.insertMany(
        commissionRecords.map((r) => ({ ...r, orderId })),
        { session }
      );
      await Order.updateOne({ _id: orderId }, { $set: { commissionTotal: totalCommission } }, { session });

      await CartItem.deleteMany({ cartId: cart._id }, { session });
    });
    if (!orderId) throw new AppError("Order creation failed", 500, "ORDER_CREATE_FAILED");

    await notifyUser(userId, {
      type: "ORDER_PLACED",
      title: "Order placed",
      message: `Your order ${orderNumber} has been placed.`,
      data: { orderNumber, orderId }
    });

    for (const vendorId of vendorIds) {
      await notifyVendor(vendorId, {
        type: "NEW_ORDER",
        title: "New order received",
        message: `You have received a new order (${orderNumber}).`,
        data: { orderNumber, orderId }
      });
      emitToVendor(vendorId, "vendor:newOrder", { orderId, orderNumber });
    }

    // Post-commit realtime + low stock alerts
    for (const inv of postCommitInventory) {
      emitGlobal("inventory:stockUpdated", { productId: inv.productId, quantity: inv.quantity });
      emitToVendor(inv.vendorId, "inventory:stockUpdated", { productId: inv.productId, quantity: inv.quantity });
      if (inv.quantity <= inv.lowStockThreshold) {
        const product = await Product.findById(inv.productId).select("title").lean();
        await notifyVendor(inv.vendorId, {
          type: "LOW_STOCK",
          title: "Low stock alert",
          message: `${product?.title ?? "A product"} is low on stock (${inv.quantity} left).`,
          data: { productId: inv.productId, quantity: inv.quantity }
        });
        emitToVendor(inv.vendorId, "inventory:lowStock", { productId: inv.productId, quantity: inv.quantity });
      }
    }

    return await getOrder(userId, orderId);
  } finally {
    session.endSession();
  }
}

export async function getOrder(userId: string, orderId: string) {
  const order = await Order.findOne({ _id: orderId, customerId: userId }).lean();
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");
  const items = await OrderItem.find({ orderId: order._id }).lean();
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    itemsSubtotal: order.itemsSubtotal,
    shippingFee: order.shippingFee,
    tax: order.tax,
    total: order.total,
    commissionTotal: order.commissionTotal,
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
      totalPrice: i.totalPrice
    }))
  };
}

export async function listMyOrders(userId: string, page = 1, limit = 20) {
  const p = Math.max(1, page);
  const l = Math.min(50, Math.max(1, limit));
  const skip = (p - 1) * l;
  const [items, total] = await Promise.all([
    Order.find({ customerId: userId }).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    Order.countDocuments({ customerId: userId })
  ]);
  return {
    page: p,
    limit: l,
    total,
    items: items.map((o) => ({ id: o._id.toString(), orderNumber: o.orderNumber, status: o.status, paymentStatus: o.paymentStatus, total: o.total, placedAt: o.placedAt }))
  };
}

export async function listVendorOrders(vendorId: string, page = 1, limit = 20) {
  const p = Math.max(1, page);
  const l = Math.min(50, Math.max(1, limit));
  const skip = (p - 1) * l;
  const orderIds = await OrderItem.distinct("orderId", { vendorId });

  const totalsAgg = await OrderItem.aggregate([
    { $match: { vendorId: mongoose.Types.ObjectId.createFromHexString(vendorId), orderId: { $in: orderIds } } },
    { $group: { _id: "$orderId", vendorTotal: { $sum: "$totalPrice" }, itemsCount: { $sum: 1 } } }
  ]);
  const totalsMap = new Map(totalsAgg.map((t: any) => [t._id.toString(), { vendorTotal: t.vendorTotal ?? 0, itemsCount: t.itemsCount ?? 0 }]));

  const [orders, total] = await Promise.all([
    Order.find({ _id: { $in: orderIds } }).sort({ createdAt: -1 }).skip(skip).limit(l).lean(),
    Order.countDocuments({ _id: { $in: orderIds } })
  ]);
  return {
    page: p,
    limit: l,
    total,
    items: orders.map((o) => {
      const t = totalsMap.get(o._id.toString()) ?? { vendorTotal: 0, itemsCount: 0 };
      return {
        id: o._id.toString(),
        orderNumber: o.orderNumber,
        status: o.status,
        paymentStatus: o.paymentStatus,
        vendorTotal: t.vendorTotal,
        itemsCount: t.itemsCount,
        placedAt: o.placedAt
      };
    })
  };
}

function aggregateCommissions(items: { vendorId: string; totalPrice: number }[], rate: number) {
  const byVendor = new Map<string, number>();
  for (const it of items) byVendor.set(it.vendorId, (byVendor.get(it.vendorId) ?? 0) + it.totalPrice);
  return Array.from(byVendor.entries()).map(([vendorId, gross]) => {
    const amountCommission = round2(gross * rate);
    const amountVendor = round2(gross - amountCommission);
    return { vendorId, rate, amountVendor, amountCommission, status: "pending" as const };
  });
}

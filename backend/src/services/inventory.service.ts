import mongoose from "mongoose";
import { Inventory } from "../models/Inventory.js";
import { Product } from "../models/Product.js";
import { AppError } from "../utils/errors.js";
import { emitGlobal, emitToVendor } from "../sockets/socketHub.js";
import { notifyVendor } from "./notification.service.js";

export async function ensureInventoryForProduct(input: { productId: string; vendorId: string; sku: string; quantity: number; lowStockThreshold?: number }) {
  const exists = await Inventory.findOne({ productId: input.productId }).lean();
  if (exists) throw new AppError("Inventory already exists", 409, "INVENTORY_EXISTS");
  return Inventory.create({
    productId: input.productId,
    vendorId: input.vendorId,
    sku: input.sku,
    quantity: input.quantity,
    lowStockThreshold: input.lowStockThreshold ?? 10
  });
}

export async function updateStock(input: { productId: string; delta: number; reason: string }) {
  const session = await mongoose.startSession();
  try {
    let updated: any;
    await session.withTransaction(async () => {
      const inv = await Inventory.findOne({ productId: input.productId }).session(session);
      if (!inv) throw new AppError("Inventory not found", 404, "NOT_FOUND");
      const nextQty = inv.quantity + input.delta;
      if (nextQty < 0) throw new AppError("Insufficient stock", 400, "INSUFFICIENT_STOCK");
      inv.quantity = nextQty;
      updated = await inv.save({ session });
    });

    const invLean = await Inventory.findOne({ productId: input.productId }).lean();
    if (!invLean) return;
    emitGlobal("inventory:stockUpdated", { productId: input.productId, quantity: invLean.quantity });
    emitToVendor(invLean.vendorId.toString(), "inventory:stockUpdated", { productId: input.productId, quantity: invLean.quantity });

    if (invLean.quantity <= invLean.lowStockThreshold) {
      const product = await Product.findById(input.productId).select("title").lean();
      await notifyVendor(invLean.vendorId.toString(), {
        type: "LOW_STOCK",
        title: "Low stock alert",
        message: `${product?.title ?? "A product"} is low on stock (${invLean.quantity} left).`,
        data: { productId: input.productId, quantity: invLean.quantity }
      });
      emitToVendor(invLean.vendorId.toString(), "inventory:lowStock", { productId: input.productId, quantity: invLean.quantity });
    }
  } finally {
    session.endSession();
  }
}

export async function reserveAndDecrementForOrder(items: { productId: string; qty: number }[]) {
  const session = await mongoose.startSession();
  try {
    const inventoryByProduct: Record<string, any> = {};
    await session.withTransaction(async () => {
      for (const it of items) {
        const inv = await Inventory.findOne({ productId: it.productId }).session(session);
        if (!inv) throw new AppError("Inventory not found", 404, "NOT_FOUND");
        if (inv.quantity < it.qty) throw new AppError("Insufficient stock", 400, "INSUFFICIENT_STOCK", { productId: it.productId });
        inv.quantity -= it.qty;
        inventoryByProduct[it.productId] = await inv.save({ session });
      }
    });

    for (const [productId, inv] of Object.entries(inventoryByProduct)) {
      emitGlobal("inventory:stockUpdated", { productId, quantity: inv.quantity });
      emitToVendor(inv.vendorId.toString(), "inventory:stockUpdated", { productId, quantity: inv.quantity });
      if (inv.quantity <= inv.lowStockThreshold) {
        const product = await Product.findById(productId).select("title").lean();
        await notifyVendor(inv.vendorId.toString(), {
          type: "LOW_STOCK",
          title: "Low stock alert",
          message: `${product?.title ?? "A product"} is low on stock (${inv.quantity} left).`,
          data: { productId, quantity: inv.quantity }
        });
        emitToVendor(inv.vendorId.toString(), "inventory:lowStock", { productId, quantity: inv.quantity });
      }
    }
  } finally {
    session.endSession();
  }
}


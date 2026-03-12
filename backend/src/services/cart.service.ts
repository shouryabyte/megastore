import mongoose from "mongoose";
import { Cart } from "../models/Cart.js";
import { CartItem } from "../models/CartItem.js";
import { Product } from "../models/Product.js";
import { Inventory } from "../models/Inventory.js";
import { AppError } from "../utils/errors.js";
import { emitToUser } from "../sockets/socketHub.js";

export async function getCart(userId: string) {
  const cart = await Cart.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { upsert: true, new: true }).lean();
  const items = await CartItem.find({ cartId: cart._id }).populate("productId").lean();
  const invIds = items.map((i: any) => i.productId?._id ?? i.productId).filter(Boolean);
  const inv = await Inventory.find({ productId: { $in: invIds } }).select("productId quantity lowStockThreshold").lean();
  const invMap = new Map(inv.map((i) => [i.productId.toString(), i]));
  return {
    id: cart._id.toString(),
    items: items.map((it: any) => ({
      id: it._id.toString(),
      quantity: it.quantity,
      priceSnapshot: it.priceSnapshot,
      product: it.productId
        ? {
            id: it.productId._id.toString(),
            title: it.productId.title,
            slug: it.productId.slug,
            price: it.productId.price,
            brand: it.productId.brand,
            images: it.productId.imageIds ?? []
          }
        : null,
      inventory: it.productId
        ? invMap.get((it.productId?._id ?? it.productId).toString())
          ? {
              quantity: invMap.get((it.productId?._id ?? it.productId).toString())!.quantity,
              lowStockThreshold: invMap.get((it.productId?._id ?? it.productId).toString())!.lowStockThreshold
            }
          : null
        : null
    }))
  };
}

export async function addToCart(userId: string, input: { productId: string; quantity: number }) {
  const session = await mongoose.startSession();
  try {
    let cartId: any;
    await session.withTransaction(async () => {
      const cart = await Cart.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { upsert: true, new: true, session });
      cartId = cart._id;
      const product = await Product.findOne({ _id: input.productId, isActive: true }).session(session).lean();
      if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
      const inventory = await Inventory.findOne({ productId: input.productId }).session(session).lean();
      if (!inventory) throw new AppError("Inventory not found", 404, "NOT_FOUND");
      if (inventory.quantity < input.quantity) throw new AppError("Insufficient stock", 400, "INSUFFICIENT_STOCK");
      await CartItem.findOneAndUpdate(
        { cartId, productId: input.productId },
        { $set: { vendorId: product.vendorId, priceSnapshot: product.price }, $inc: { quantity: input.quantity } },
        { upsert: true, new: true, session }
      );
    });
    const cart = await getCart(userId);
    emitToUser(userId, "cart:updated", cart);
    return cart;
  } finally {
    session.endSession();
  }
}

export async function updateCartItem(userId: string, input: { itemId: string; quantity: number }) {
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart) throw new AppError("Cart not found", 404, "NOT_FOUND");
  const item = await CartItem.findOne({ _id: input.itemId, cartId: cart._id });
  if (!item) throw new AppError("Cart item not found", 404, "NOT_FOUND");
  const inv = await Inventory.findOne({ productId: item.productId }).lean();
  if (!inv) throw new AppError("Inventory not found", 404, "NOT_FOUND");
  if (inv.quantity < input.quantity) throw new AppError("Insufficient stock", 400, "INSUFFICIENT_STOCK");
  item.quantity = input.quantity;
  await item.save();
  const payload = await getCart(userId);
  emitToUser(userId, "cart:updated", payload);
  return payload;
}

export async function removeCartItem(userId: string, itemId: string) {
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart) throw new AppError("Cart not found", 404, "NOT_FOUND");
  await CartItem.deleteOne({ _id: itemId, cartId: cart._id });
  const payload = await getCart(userId);
  emitToUser(userId, "cart:updated", payload);
  return payload;
}

export async function clearCart(userId: string) {
  const cart = await Cart.findOne({ userId }).lean();
  if (!cart) return;
  await CartItem.deleteMany({ cartId: cart._id });
  const payload = await getCart(userId);
  emitToUser(userId, "cart:updated", payload);
  return payload;
}

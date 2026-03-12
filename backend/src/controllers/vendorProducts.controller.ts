import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createProduct, updateProduct } from "../services/product.service.js";
import { ensureInventoryForProduct } from "../services/inventory.service.js";
import { AppError } from "../utils/errors.js";
import { Product } from "../models/Product.js";
import { Inventory } from "../models/Inventory.js";
import { emitGlobal, emitToVendor } from "../sockets/socketHub.js";
import { ProductImage } from "../models/ProductImage.js";
import { deleteImageByPublicId } from "../services/cloudinary.service.js";
import { CartItem } from "../models/CartItem.js";
import { Wishlist } from "../models/Wishlist.js";
import { Review } from "../models/Review.js";

const CreateProductSchema = z.object({
  body: z.object({
    categoryId: z.string().min(1),
    title: z.string().min(2).max(160),
    brand: z.string().min(1).max(120),
    modelNumber: z.string().max(160).optional(),
    description: z.string().max(8000).optional(),
    price: z.number().min(0),
    mrp: z.number().min(0).optional(),
    bulkPricing: z.array(z.object({ minQty: z.number().int().min(1), price: z.number().min(0) })).max(20).optional(),
    specs: z.record(z.string().max(160), z.string().max(500)).optional(),
    compatibility: z.array(z.string().max(120)).max(50).optional(),
    tags: z.array(z.string().max(40)).max(30).optional(),
    sku: z.string().min(3).max(160),
    stock: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0).optional()
  })
});

export const createVendorProductHandler: RequestHandler[] = [
  validate(CreateProductSchema),
  asyncHandler(async (req: any, res) => {
    const vendorId = req.auth?.vendorId;
    if (!vendorId) throw new AppError("Forbidden", 403, "FORBIDDEN");
    const body = req.validated.body;
    const product = await createProduct({ vendorId, ...body });
    await ensureInventoryForProduct({ productId: product._id.toString(), vendorId, sku: body.sku, quantity: body.stock, lowStockThreshold: body.lowStockThreshold });
    res.status(201).json({ ok: true, productId: product._id.toString(), slug: product.slug });
  })
];

const UpdateSchema = z.object({
  body: z.object({
    categoryId: z.string().optional(),
    title: z.string().min(2).max(160).optional(),
    brand: z.string().min(1).max(120).optional(),
    modelNumber: z.string().max(160).optional(),
    description: z.string().max(8000).optional(),
    price: z.number().min(0).optional(),
    mrp: z.number().min(0).optional(),
    bulkPricing: z.array(z.object({ minQty: z.number().int().min(1), price: z.number().min(0) })).max(20).optional(),
    specs: z.record(z.string().max(160), z.string().max(500)).optional(),
    compatibility: z.array(z.string().max(120)).max(50).optional(),
    tags: z.array(z.string().max(40)).max(30).optional(),
    stock: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional()
  })
});

export const updateVendorProductHandler: RequestHandler[] = [
  validate(UpdateSchema),
  asyncHandler(async (req: any, res) => {
    const vendorId = req.auth?.vendorId;
    if (!vendorId) throw new AppError("Forbidden", 403, "FORBIDDEN");
    const productId = req.params.id;
    const patch = req.validated.body;
    await updateProduct(vendorId, productId, patch);
    if (patch.stock !== undefined || patch.lowStockThreshold !== undefined) {
      const product = await Product.findOne({ _id: productId, vendorId }).lean();
      if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
      const inv = await Inventory.findOneAndUpdate(
        { productId },
        { $set: { ...(patch.stock !== undefined ? { quantity: patch.stock } : {}), ...(patch.lowStockThreshold !== undefined ? { lowStockThreshold: patch.lowStockThreshold } : {}) } },
        { new: true }
      );
      if (inv && patch.stock !== undefined) {
        emitGlobal("inventory:stockUpdated", { productId, quantity: inv.quantity });
        emitToVendor(vendorId, "inventory:stockUpdated", { productId, quantity: inv.quantity });
      }
    }
    res.json({ ok: true });
  })
];

export const listMyVendorProductsHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const vendorId = req.auth?.vendorId;
  if (!vendorId) throw new AppError("Forbidden", 403, "FORBIDDEN");
  const products = await Product.find({ vendorId }).sort({ createdAt: -1 }).populate("imageIds").lean();
  const inv = await Inventory.find({ vendorId }).select("productId quantity lowStockThreshold sku").lean();
  const invMap = new Map(inv.map((i) => [i.productId.toString(), i]));
  res.json({
    ok: true,
    items: products.map((p: any) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      brand: p.brand,
      price: p.price,
      isActive: p.isActive,
      images: (p.imageIds ?? []).filter(Boolean).map((img: any) => ({ id: img._id.toString(), url: img.url, alt: img.alt, sortOrder: img.sortOrder })),
      inventory: invMap.get(p._id.toString())
        ? { sku: invMap.get(p._id.toString())!.sku, quantity: invMap.get(p._id.toString())!.quantity, lowStockThreshold: invMap.get(p._id.toString())!.lowStockThreshold }
        : null
    }))
  });
});

export const deleteVendorProductHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const vendorId = req.auth?.vendorId;
  if (!vendorId) throw new AppError("Forbidden", 403, "FORBIDDEN");
  const productId = req.params.id;

  const product = await Product.findOne({ _id: productId, vendorId }).select("_id").lean();
  if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");

  const images = await ProductImage.find({ productId, vendorId }).select("publicId").lean();
  await Promise.allSettled(images.map((img) => deleteImageByPublicId(img.publicId)));

  await Promise.all([
    ProductImage.deleteMany({ productId, vendorId }),
    Inventory.deleteOne({ productId, vendorId }),
    CartItem.deleteMany({ productId }),
    Wishlist.updateMany({ productIds: productId }, { $pull: { productIds: productId } }),
    Review.deleteMany({ productId }),
    Product.deleteOne({ _id: productId, vendorId })
  ]);

  res.json({ ok: true });
});

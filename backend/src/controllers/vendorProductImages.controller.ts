import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { addProductImage, removeProductImage } from "../services/product.service.js";
import { deleteImageByPublicId } from "../services/cloudinary.service.js";
import { AppError } from "../utils/errors.js";
import { ProductImage } from "../models/ProductImage.js";

const AddSchema = z.object({
  body: z.object({
    url: z.string().url(),
    publicId: z.string().min(1),
    alt: z.string().max(180).optional(),
    sortOrder: z.number().int().min(0).max(100).optional()
  })
});

export const addVendorProductImageHandler: RequestHandler[] = [
  validate(AddSchema),
  asyncHandler(async (req: any, res) => {
    const vendorId = req.auth?.vendorId;
    if (!vendorId) throw new AppError("Forbidden", 403, "FORBIDDEN");
    const img = await addProductImage({ vendorId, productId: req.params.id, ...req.validated.body });
    res.status(201).json({ ok: true, image: { id: img._id.toString(), url: img.url, publicId: img.publicId } });
  })
];

export const deleteVendorProductImageHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const vendorId = req.auth?.vendorId;
  if (!vendorId) throw new AppError("Forbidden", 403, "FORBIDDEN");
  const image = await ProductImage.findOne({ _id: req.params.imageId, vendorId }).lean();
  if (image) await deleteImageByPublicId(image.publicId);
  await removeProductImage({ vendorId, productId: req.params.id, imageId: req.params.imageId });
  res.json({ ok: true });
});


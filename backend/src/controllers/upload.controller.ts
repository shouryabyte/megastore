import type { RequestHandler } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadImageBuffer } from "../services/cloudinary.service.js";
import { deleteImageByPublicId } from "../services/cloudinary.service.js";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { AppError } from "../utils/errors.js";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

export const uploadProductImageHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ ok: false, error: { code: "NO_FILE", message: "No file uploaded" } });
  if (!file.mimetype?.startsWith("image/")) return res.status(400).json({ ok: false, error: { code: "INVALID_FILE", message: "Only image uploads are allowed" } });
  const result = await uploadImageBuffer({ buffer: file.buffer, folder: "nexchakra/products", mimetype: file.mimetype });
  res.status(201).json({ ok: true, image: { url: result.url, publicId: result.publicId } });
});

const DeleteSchema = z.object({ body: z.object({ publicId: z.string().min(1).max(300) }) });

export const deleteProductImageHandler: RequestHandler[] = [
  validate(DeleteSchema),
  asyncHandler(async (req: any, res) => {
    const publicId = String(req.validated.body.publicId);
    if (!publicId.startsWith("nexchakra/products/")) throw new AppError("Invalid publicId", 400, "INVALID_PUBLIC_ID");
    await deleteImageByPublicId(publicId);
    res.json({ ok: true });
  })
];

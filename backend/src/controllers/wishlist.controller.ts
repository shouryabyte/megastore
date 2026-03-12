import type { RequestHandler } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { addToWishlist, getWishlist, removeFromWishlist } from "../services/wishlist.service.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import { AppError } from "../utils/errors.js";

export const getWishlistHandler: RequestHandler = asyncHandler(async (req: AuthedRequest, res) => {
  if (!req.auth) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  const wishlist = await getWishlist(req.auth.sub);
  res.json({ ok: true, wishlist });
});

export const addWishlistHandler: RequestHandler = asyncHandler(async (req: AuthedRequest, res) => {
  if (!req.auth) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  const wishlist = await addToWishlist(req.auth.sub, req.params.productId);
  res.json({ ok: true, wishlist });
});

export const removeWishlistHandler: RequestHandler = asyncHandler(async (req: AuthedRequest, res) => {
  if (!req.auth) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  const wishlist = await removeFromWishlist(req.auth.sub, req.params.productId);
  res.json({ ok: true, wishlist });
});


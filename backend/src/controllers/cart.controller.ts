import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getCart, addToCart, updateCartItem, removeCartItem, clearCart } from "../services/cart.service.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import { AppError } from "../utils/errors.js";

const AddSchema = z.object({ body: z.object({ productId: z.string().min(1), quantity: z.number().int().min(1).max(50) }) });
const UpdateSchema = z.object({ body: z.object({ itemId: z.string().min(1), quantity: z.number().int().min(1).max(50) }) });

export const getCartHandler: RequestHandler = asyncHandler(async (req: AuthedRequest, res) => {
  if (!req.auth) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  const cart = await getCart(req.auth.sub);
  res.json({ ok: true, cart });
});

export const addToCartHandler: RequestHandler[] = [
  validate(AddSchema),
  asyncHandler(async (req: any, res) => {
    const cart = await addToCart(req.auth.sub, req.validated.body);
    res.json({ ok: true, cart });
  })
];

export const updateCartItemHandler: RequestHandler[] = [
  validate(UpdateSchema),
  asyncHandler(async (req: any, res) => {
    const cart = await updateCartItem(req.auth.sub, req.validated.body);
    res.json({ ok: true, cart });
  })
];

export const removeCartItemHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const cart = await removeCartItem(req.auth.sub, req.params.itemId);
  res.json({ ok: true, cart });
});

export const clearCartHandler: RequestHandler = asyncHandler(async (req: any, res) => {
  const cart = await clearCart(req.auth.sub);
  res.json({ ok: true, cart });
});


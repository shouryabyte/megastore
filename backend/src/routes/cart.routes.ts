import { Router } from "express";
import { addToCartHandler, clearCartHandler, getCartHandler, removeCartItemHandler, updateCartItemHandler } from "../controllers/cart.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

export const cartRoutes = Router();

cartRoutes.get("/", requireAuth, requireRole(["Customer"]), getCartHandler);
cartRoutes.post("/items", requireAuth, requireRole(["Customer"]), ...addToCartHandler);
cartRoutes.patch("/items", requireAuth, requireRole(["Customer"]), ...updateCartItemHandler);
cartRoutes.delete("/items/:itemId", requireAuth, requireRole(["Customer"]), removeCartItemHandler);
cartRoutes.delete("/", requireAuth, requireRole(["Customer"]), clearCartHandler);

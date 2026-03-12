import { Router } from "express";
import { addWishlistHandler, getWishlistHandler, removeWishlistHandler } from "../controllers/wishlist.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

export const wishlistRoutes = Router();

wishlistRoutes.get("/", requireAuth, requireRole(["Customer"]), getWishlistHandler);
wishlistRoutes.post("/:productId", requireAuth, requireRole(["Customer"]), addWishlistHandler);
wishlistRoutes.delete("/:productId", requireAuth, requireRole(["Customer"]), removeWishlistHandler);

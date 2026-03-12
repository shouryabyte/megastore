import { Router } from "express";
import { createReviewHandler, listProductReviewsHandler } from "../controllers/review.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

export const reviewRoutes = Router();

reviewRoutes.get("/product/:productId", listProductReviewsHandler);
reviewRoutes.post("/", requireAuth, requireRole(["Customer"]), ...createReviewHandler);

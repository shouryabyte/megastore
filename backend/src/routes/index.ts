import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { productRoutes } from "./product.routes.js";
import { vendorRoutes } from "./vendor.routes.js";
import { cartRoutes } from "./cart.routes.js";
import { wishlistRoutes } from "./wishlist.routes.js";
import { orderRoutes } from "./order.routes.js";
import { paymentRoutes } from "./payment.routes.js";
import { uploadRoutes } from "./upload.routes.js";
import { categoryRoutes } from "./category.routes.js";
import { reviewRoutes } from "./review.routes.js";
import { notificationRoutes } from "./notification.routes.js";
import { adminRoutes } from "./admin.routes.js";

export const api = Router();

api.get("/health", (_req, res) => res.json({ ok: true, service: "nexchakra-backend" }));
api.use("/auth", authRoutes);
api.use("/categories", categoryRoutes);
api.use("/products", productRoutes);
api.use("/vendors", vendorRoutes);
api.use("/cart", cartRoutes);
api.use("/wishlist", wishlistRoutes);
api.use("/orders", orderRoutes);
api.use("/payments", paymentRoutes);
api.use("/uploads", uploadRoutes);
api.use("/reviews", reviewRoutes);
api.use("/notifications", notificationRoutes);
api.use("/admin", adminRoutes);


import { Router } from "express";
import { getStorefrontHandler, updateMyVendorProfileHandler } from "../controllers/vendor.controller.js";
import { createVendorProductHandler, deleteVendorProductHandler, listMyVendorProductsHandler, updateVendorProductHandler } from "../controllers/vendorProducts.controller.js";
import { addVendorProductImageHandler, deleteVendorProductImageHandler } from "../controllers/vendorProductImages.controller.js";
import { vendorOverviewHandler } from "../controllers/vendorAnalytics.controller.js";
import { listVendorRatingsHandler, rateVendorHandler } from "../controllers/vendorRating.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { requireVendorApproved } from "../middlewares/vendor.middleware.js";

export const vendorRoutes = Router();

vendorRoutes.get("/store/:slug", getStorefrontHandler);
vendorRoutes.get("/:vendorId/ratings", listVendorRatingsHandler);
vendorRoutes.post("/:vendorId/ratings", requireAuth, requireRole(["Customer"]), ...rateVendorHandler);
vendorRoutes.patch("/me", requireAuth, requireRole(["Vendor"]), updateMyVendorProfileHandler);

vendorRoutes.get("/me/products", requireAuth, requireRole(["Vendor"]), requireVendorApproved, listMyVendorProductsHandler);
vendorRoutes.post("/me/products", requireAuth, requireRole(["Vendor"]), requireVendorApproved, ...createVendorProductHandler);
vendorRoutes.patch("/me/products/:id", requireAuth, requireRole(["Vendor"]), requireVendorApproved, ...updateVendorProductHandler);
vendorRoutes.delete("/me/products/:id", requireAuth, requireRole(["Vendor"]), requireVendorApproved, deleteVendorProductHandler);
vendorRoutes.post("/me/products/:id/images", requireAuth, requireRole(["Vendor"]), requireVendorApproved, ...addVendorProductImageHandler);
vendorRoutes.delete("/me/products/:id/images/:imageId", requireAuth, requireRole(["Vendor"]), requireVendorApproved, deleteVendorProductImageHandler);
vendorRoutes.get("/me/analytics", requireAuth, requireRole(["Vendor"]), requireVendorApproved, vendorOverviewHandler);

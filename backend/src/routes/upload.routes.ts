import { Router } from "express";
import { deleteProductImageHandler, upload, uploadProductImageHandler } from "../controllers/upload.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { requireVendorApproved } from "../middlewares/vendor.middleware.js";

export const uploadRoutes = Router();

uploadRoutes.post("/product-image", requireAuth, requireRole(["Vendor"]), requireVendorApproved, upload.single("file"), uploadProductImageHandler);
uploadRoutes.delete("/product-image", requireAuth, requireRole(["Vendor"]), requireVendorApproved, ...deleteProductImageHandler);

import { Router } from "express";
import { createOrderHandler, downloadInvoiceHandler, getMyOrderHandler, listMyOrdersHandler, listVendorOrdersHandler } from "../controllers/order.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { requireVendorApproved } from "../middlewares/vendor.middleware.js";
import { getVendorOrderHandler, updateVendorOrderItemStatusHandler } from "../controllers/vendorOrders.controller.js";

export const orderRoutes = Router();

orderRoutes.post("/", requireAuth, requireRole(["Customer"]), ...createOrderHandler);
orderRoutes.get("/", requireAuth, requireRole(["Customer"]), listMyOrdersHandler);
orderRoutes.get("/:id", requireAuth, requireRole(["Customer"]), getMyOrderHandler);
orderRoutes.get("/:id/invoice", requireAuth, requireRole(["Customer"]), downloadInvoiceHandler);

orderRoutes.get("/vendor/list", requireAuth, requireRole(["Vendor"]), requireVendorApproved, listVendorOrdersHandler);
orderRoutes.get("/vendor/:orderId", requireAuth, requireRole(["Vendor"]), requireVendorApproved, getVendorOrderHandler);
orderRoutes.patch("/vendor/:orderId/items/:itemId/status", requireAuth, requireRole(["Vendor"]), requireVendorApproved, ...updateVendorOrderItemStatusHandler);

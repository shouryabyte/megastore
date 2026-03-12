import { Router } from "express";
import { approveVendorHandler, blockUserHandler, listPendingVendorsHandler, rejectVendorHandler, adminOverviewHandler, listVendorVerificationsHandler } from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import { adminListProductsHandler, adminPatchProductHandler } from "../controllers/adminProducts.controller.js";
import { adminGetOrderHandler, adminListOrdersHandler } from "../controllers/adminOrders.controller.js";
import { adminListUsersHandler, adminUnblockUserHandler } from "../controllers/adminUsers.controller.js";
import { adminDeleteReviewHandler, adminListReviewsHandler } from "../controllers/adminReviews.controller.js";
import { adminListCommissionsHandler, adminPatchCommissionHandler } from "../controllers/adminCommissions.controller.js";
import { adminPatchCategoryHandler } from "../controllers/adminCategories.controller.js";
import { adminGetVendorHandler, adminListVendorsHandler } from "../controllers/adminVendors.controller.js";

export const adminRoutes = Router();

adminRoutes.get("/overview", requireAuth, requireRole(["Admin"]), adminOverviewHandler);
adminRoutes.get("/vendors/pending", requireAuth, requireRole(["Admin"]), listPendingVendorsHandler);
adminRoutes.get("/vendors", requireAuth, requireRole(["Admin"]), ...adminListVendorsHandler);
adminRoutes.get("/vendors/:vendorId", requireAuth, requireRole(["Admin"]), adminGetVendorHandler);
adminRoutes.post("/vendors/:vendorId/approve", requireAuth, requireRole(["Admin"]), approveVendorHandler);
adminRoutes.post("/vendors/:vendorId/reject", requireAuth, requireRole(["Admin"]), rejectVendorHandler);
adminRoutes.post("/users/:userId/block", requireAuth, requireRole(["Admin"]), blockUserHandler);
adminRoutes.post("/users/:userId/unblock", requireAuth, requireRole(["Admin"]), adminUnblockUserHandler);
adminRoutes.get("/users", requireAuth, requireRole(["Admin"]), ...adminListUsersHandler);
adminRoutes.get("/vendor-verifications", requireAuth, requireRole(["Admin"]), listVendorVerificationsHandler);

adminRoutes.get("/products", requireAuth, requireRole(["Admin"]), ...adminListProductsHandler);
adminRoutes.patch("/products/:productId", requireAuth, requireRole(["Admin"]), ...adminPatchProductHandler);

adminRoutes.get("/orders", requireAuth, requireRole(["Admin"]), ...adminListOrdersHandler);
adminRoutes.get("/orders/:orderId", requireAuth, requireRole(["Admin"]), adminGetOrderHandler);

adminRoutes.get("/reviews", requireAuth, requireRole(["Admin"]), ...adminListReviewsHandler);
adminRoutes.delete("/reviews/:reviewId", requireAuth, requireRole(["Admin"]), adminDeleteReviewHandler);

adminRoutes.get("/commissions", requireAuth, requireRole(["Admin"]), ...adminListCommissionsHandler);
adminRoutes.patch("/commissions/:commissionId", requireAuth, requireRole(["Admin"]), ...adminPatchCommissionHandler);

adminRoutes.patch("/categories/:categoryId", requireAuth, requireRole(["Admin"]), ...adminPatchCategoryHandler);

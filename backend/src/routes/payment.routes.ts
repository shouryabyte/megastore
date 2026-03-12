import { Router } from "express";
import { createPaymentOrderHandler, verifyPaymentHandler } from "../controllers/payment.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

export const paymentRoutes = Router();

paymentRoutes.post("/razorpay/order", requireAuth, requireRole(["Customer"]), ...createPaymentOrderHandler);
paymentRoutes.post("/razorpay/verify", requireAuth, requireRole(["Customer"]), ...verifyPaymentHandler);

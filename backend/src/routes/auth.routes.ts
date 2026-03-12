import { Router } from "express";
import { loginHandler, logoutHandler, meHandler, refreshHandler, registerCustomerHandler, registerVendorHandler } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.middleware.js";

export const authRoutes = Router();

authRoutes.post("/register", ...registerCustomerHandler);
authRoutes.post("/register-vendor", ...registerVendorHandler);
authRoutes.post("/login", ...loginHandler);
authRoutes.post("/refresh", refreshHandler);
authRoutes.post("/logout", logoutHandler);
authRoutes.get("/me", requireAuth, meHandler);


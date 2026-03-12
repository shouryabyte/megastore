import type { RequestHandler } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerCustomer, registerVendor, login, logout, rotateRefresh, sanitizeUser } from "../services/auth.service.js";
import { AppError } from "../utils/errors.js";
import { verifyRefreshToken } from "../utils/jwt.js";
import { isProd } from "../config/env.js";
import { User } from "../models/User.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";

const RegisterSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email().max(160),
    password: z.string().min(8).max(72)
  })
});

const RegisterVendorSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email().max(160),
    password: z.string().min(8).max(72),
    storeName: z.string().min(2).max(120)
  })
});

const LoginSchema = z.object({
  body: z.object({
    email: z.string().email().max(160),
    password: z.string().min(8).max(72)
  })
});

function setRefreshCookie(res: any, refresh: string) {
  res.cookie("refresh_token", refresh, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/api/auth/refresh",
    maxAge: 30 * 24 * 60 * 60 * 1000
  });
}

function clearRefreshCookie(res: any) {
  res.clearCookie("refresh_token", { path: "/api/auth/refresh" });
}

export const registerCustomerHandler: RequestHandler[] = [
  validate(RegisterSchema),
  asyncHandler(async (req: any, res) => {
    const { name, email, password } = req.validated.body;
    const result = await registerCustomer({ name, email, password });
    setRefreshCookie(res, result.refresh);
    res.json({ ok: true, user: result.user, accessToken: result.access });
  })
];

export const registerVendorHandler: RequestHandler[] = [
  validate(RegisterVendorSchema),
  asyncHandler(async (req: any, res) => {
    const { name, email, password, storeName } = req.validated.body;
    const result = await registerVendor({ name, email, password, storeName });
    setRefreshCookie(res, result.refresh);
    res.json({ ok: true, user: result.user, vendor: { id: result.vendor._id.toString(), status: result.vendor.status }, accessToken: result.access });
  })
];

export const loginHandler: RequestHandler[] = [
  validate(LoginSchema),
  asyncHandler(async (req: any, res) => {
    const { email, password } = req.validated.body;
    const result = await login(email, password);
    setRefreshCookie(res, result.refresh);
    res.json({ ok: true, user: result.user, accessToken: result.access });
  })
];

export const refreshHandler: RequestHandler = asyncHandler(async (req, res) => {
  const token = (req as any).cookies?.refresh_token as string | undefined;
  if (!token) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  const payload = verifyRefreshToken(token);
  const result = await rotateRefresh(payload.sub, token);
  setRefreshCookie(res, result.refresh);
  res.json({ ok: true, user: result.user, accessToken: result.access });
});

export const logoutHandler: RequestHandler = asyncHandler(async (req, res) => {
  const token = (req as any).cookies?.refresh_token as string | undefined;
  if (token) {
    try {
      const payload = verifyRefreshToken(token);
      await logout(payload.sub);
    } catch {
      // ignore
    }
  }
  clearRefreshCookie(res);
  res.json({ ok: true });
});

export const meHandler: RequestHandler = asyncHandler(async (req: AuthedRequest, res) => {
  if (!req.auth) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  const user = await User.findById(req.auth.sub).select("_id name email role vendorId").lean();
  if (!user) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  res.json({ ok: true, user: sanitizeUser(user as any) });
});

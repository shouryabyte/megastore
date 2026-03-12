import type { Request, RequestHandler } from "express";
import { AppError } from "../utils/errors.js";
import { verifyAccessToken, type JwtRole, type AccessTokenPayload } from "../utils/jwt.js";
import { User } from "../models/User.js";

declare global {
  // eslint-disable-next-line no-var
  var __auth: undefined;
}

export type AuthedRequest = Request & { auth?: AccessTokenPayload };

export const requireAuth: RequestHandler = async (req: AuthedRequest, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("_id tokenVersion role vendorId isBlocked").lean();
    if (!user) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    if ((user as any).isBlocked) return next(new AppError("Forbidden", 403, "BLOCKED"));
    if (user.tokenVersion !== payload.tokenVersion) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    if (user.role !== payload.role) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    req.auth = { ...payload, vendorId: user.vendorId ? user.vendorId.toString() : undefined };
    next();
  } catch {
    next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  }
};

export function requireRole(roles: JwtRole[]): RequestHandler {
  return (req: AuthedRequest, _res, next) => {
    if (!req.auth) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
    if (!roles.includes(req.auth.role)) return next(new AppError("Forbidden", 403, "FORBIDDEN"));
    next();
  };
}

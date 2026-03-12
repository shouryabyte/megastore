import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type JwtRole = "Admin" | "Vendor" | "Customer";

export type AccessTokenPayload = {
  sub: string;
  role: JwtRole;
  vendorId?: string;
  tokenVersion: number;
};

export function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "15m" });
}

export function signRefreshToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessTokenPayload;
}

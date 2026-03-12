import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

function hmacSha256Hex(input: string) {
  return crypto.createHmac("sha256", env.JWT_REFRESH_SECRET).update(input).digest("hex");
}

export function hashRefreshToken(token: string) {
  // Prefix so we can support multiple hash formats/migrations safely.
  return `hmacsha256:${hmacSha256Hex(token)}`;
}

export async function verifyRefreshToken(token: string, storedHash: string) {
  if (!storedHash) return false;
  // Backward compatibility: older deployments stored bcrypt hashes.
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    return bcrypt.compare(token, storedHash);
  }
  if (!storedHash.startsWith("hmacsha256:")) return false;
  const expected = Buffer.from(storedHash.slice("hmacsha256:".length), "utf8");
  const actual = Buffer.from(hmacSha256Hex(token), "utf8");
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}


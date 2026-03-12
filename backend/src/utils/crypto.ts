import crypto from "crypto";

export function hmacSha256Hex(secret: string, payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}


import bcrypt from "bcryptjs";
import { env } from "./env.js";
import { User } from "../models/User.js";
import { logger } from "../utils/logger.js";

export async function seedAdminIfEnv() {
  if (!env.SEED_ADMIN_EMAIL || !env.SEED_ADMIN_PASSWORD) return;
  const email = env.SEED_ADMIN_EMAIL.trim().toLowerCase();
  const existing = await User.findOne({ email }).select("_id role").lean();
  if (existing) {
    if (existing.role !== "Admin") {
      logger.warn({ msg: "SEED_ADMIN_EMAIL exists but is not an Admin", email });
    }
    return;
  }
  const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12);
  await User.create({ name: "Admin", email, passwordHash, role: "Admin" });
  logger.warn({ msg: "Seeded admin user from env", email });
}

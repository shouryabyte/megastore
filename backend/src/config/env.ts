import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  PORT: z.string().default("5000"),
  MONGO_URI: z.string().min(1),
  JWT_SECRET: z.string().min(24),
  JWT_REFRESH_SECRET: z.string().min(24),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().min(1),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_TEST_MODE: z.coerce.boolean().default(false),
  // Comma-separated list of allowed frontend origins (Vercel + local dev).
  FRONTEND_URL: z.string().min(1),
  SEED_ADMIN_EMAIL: z.string().email().optional(),
  SEED_ADMIN_PASSWORD: z.string().min(12).max(72).optional()
});

export const env = EnvSchema.parse(process.env);

export const isProd = process.env.NODE_ENV === "production";

const OriginSchema = z.string().url();
export const frontendOrigins = env.FRONTEND_URL.split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map((o) => OriginSchema.parse(o));

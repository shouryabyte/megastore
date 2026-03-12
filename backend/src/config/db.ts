import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";
import { Inventory } from "../models/Inventory.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI, {
    autoIndex: true
  });
  logger.info({ msg: "MongoDB connected" });

  // Keep critical indexes in sync (notably Inventory SKU uniqueness per vendor).
  // This self-heals older deployments that had a global unique sku index.
  try {
    await Inventory.syncIndexes();
  } catch (err) {
    logger.warn({ err }, "Failed to sync Inventory indexes");
  }
}

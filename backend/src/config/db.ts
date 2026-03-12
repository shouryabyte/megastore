import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI, {
    autoIndex: true
  });
  logger.info({ msg: "MongoDB connected" });
}


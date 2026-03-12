import express from "express";
import cookieParser from "cookie-parser";
import * as pinoHttp from "pino-http";
import { api } from "./routes/index.js";
import { applySecurity } from "./middlewares/security.middleware.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { logger } from "./utils/logger.js";
import { isProd } from "./config/env.js";

export function createApp() {
  const app = express();
  if (isProd) app.set("trust proxy", 1);
  const httpLogger = (pinoHttp as any).default ? (pinoHttp as any).default({ logger }) : (pinoHttp as any)({ logger });
  app.use(httpLogger);
  applySecurity(app);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use("/api", api);
  app.use(errorMiddleware);
  return app;
}

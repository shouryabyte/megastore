import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import type { Express } from "express";
import { frontendOrigins, isProd } from "../config/env.js";

export function applySecurity(app: Express) {
  app.disable("x-powered-by");
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow non-browser clients (curl, server-to-server) with no Origin header.
        if (!origin) return cb(null, true);
        if (frontendOrigins.includes(origin)) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"]
    })
  );
  app.use(helmet());
  app.use(compression());
  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: isProd ? 600 : 2000,
      standardHeaders: "draft-7",
      legacyHeaders: false
    })
  );
}

import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  // Mongo duplicate key errors (e.g., unique SKU per vendor).
  if (err?.code === 11000) {
    const isSku = Boolean(err?.keyPattern?.sku || err?.keyValue?.sku);
    const message = isSku ? "SKU already exists. Please use a unique SKU." : "Duplicate value";
    return res.status(409).json({ ok: false, error: { code: isSku ? "SKU_CONFLICT" : "DUPLICATE_KEY", message } });
  }

  const isApp = err instanceof AppError;
  const status = isApp ? err.statusCode : 500;
  const body = {
    ok: false,
    error: {
      code: isApp ? err.code : "INTERNAL_ERROR",
      message: isApp ? err.message : "Something went wrong",
      ...(isApp && err.code === "VALIDATION_ERROR" && err.details ? { details: err.details } : {})
    }
  };

  if (status >= 500) logger.error({ err }, "Unhandled error");
  res.status(status).json(body);
};

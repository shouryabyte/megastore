import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
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

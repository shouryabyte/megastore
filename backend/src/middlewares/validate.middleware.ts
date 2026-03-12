import type { RequestHandler } from "express";
import type { ZodSchema } from "zod";
import { AppError } from "../utils/errors.js";

export function validate(schema: ZodSchema): RequestHandler {
  return (req, _res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    if (!parsed.success) return next(new AppError("Invalid request", 400, "VALIDATION_ERROR", parsed.error.flatten()));
    (req as any).validated = parsed.data;
    next();
  };
}


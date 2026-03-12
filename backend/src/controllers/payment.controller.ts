import type { RequestHandler } from "express";
import { z } from "zod";
import { validate } from "../middlewares/validate.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createRazorpayOrder, verifyRazorpayPayment } from "../services/payment.service.js";

const CreateSchema = z.object({ body: z.object({ orderId: z.string().min(1) }) });
const VerifySchema = z.object({
  body: z.object({
    orderId: z.string().min(1),
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1)
  })
});

export const createPaymentOrderHandler: RequestHandler[] = [
  validate(CreateSchema),
  asyncHandler(async (req: any, res) => {
    const result = await createRazorpayOrder(req.auth.sub, req.validated.body.orderId);
    res.json({ ok: true, ...result });
  })
];

export const verifyPaymentHandler: RequestHandler[] = [
  validate(VerifySchema),
  asyncHandler(async (req: any, res) => {
    const result = await verifyRazorpayPayment(req.auth.sub, req.validated.body);
    res.json(result);
  })
];

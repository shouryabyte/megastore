import { razorpay } from "../config/razorpay.js";
import { env } from "../config/env.js";
import { Payment } from "../models/Payment.js";
import { Order } from "../models/Order.js";
import { AppError } from "../utils/errors.js";
import { hmacSha256Hex } from "../utils/crypto.js";
import { notifyUser } from "./notification.service.js";
import { OrderItem } from "../models/OrderItem.js";

export async function createRazorpayOrder(userId: string, orderId: string) {
  const order = await Order.findOne({ _id: orderId, customerId: userId }).lean();
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");
  if (order.paymentStatus === "paid") throw new AppError("Order already paid", 409, "ALREADY_PAID");
  const displayAmount = order.total;
  const amountToCharge = env.RAZORPAY_TEST_MODE ? 1 : displayAmount;
  const amountPaise = Math.round(amountToCharge * 100);
  let rpOrder: any;
  try {
    rpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: order.orderNumber,
      notes: { orderId: order._id.toString(), orderNumber: order.orderNumber }
    });
  } catch (err: any) {
    const msg =
      err?.error?.description ||
      err?.error?.reason ||
      err?.message ||
      "Unable to create Razorpay order. Check Razorpay keys and network access.";
    throw new AppError(msg, 502, "PAYMENT_PROVIDER_ERROR");
  }
  await Payment.findOneAndUpdate(
    { orderId: order._id },
    { $set: { customerId: userId, razorpayOrderId: rpOrder.id, status: "created", amount: amountToCharge, currency: "INR", isTest: env.RAZORPAY_TEST_MODE } },
    { upsert: true, new: true }
  );
  return {
    razorpayOrderId: rpOrder.id,
    amount: amountToCharge,
    currency: "INR",
    keyId: env.RAZORPAY_KEY_ID,
    testMode: env.RAZORPAY_TEST_MODE,
    displayAmount
  };
}

export async function verifyRazorpayPayment(userId: string, input: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
  const order = await Order.findOne({ _id: input.orderId, customerId: userId });
  if (!order) throw new AppError("Order not found", 404, "NOT_FOUND");
  if (order.paymentStatus === "paid") return { ok: true };

  const computed = hmacSha256Hex(env.RAZORPAY_KEY_SECRET, `${input.razorpayOrderId}|${input.razorpayPaymentId}`);
  if (computed !== input.razorpaySignature) throw new AppError("Invalid payment signature", 400, "PAYMENT_INVALID");

  await Payment.findOneAndUpdate(
    { orderId: order._id },
    {
      $set: {
        razorpayOrderId: input.razorpayOrderId,
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
        status: "captured",
        capturedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );
  order.paymentStatus = "paid";
  if (order.status === "placed") order.status = "confirmed";
  await order.save();
  await OrderItem.updateMany({ orderId: order._id, status: "placed" }, { $set: { status: "confirmed" } });
  await notifyUser(userId, {
    type: "PAYMENT_SUCCESS",
    title: "Payment successful",
    message: `Payment received for ${order.orderNumber}.`,
    data: { orderId: order._id.toString(), orderNumber: order.orderNumber }
  });
  return { ok: true };
}

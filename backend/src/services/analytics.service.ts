import { User } from "../models/User.js";
import { Vendor } from "../models/Vendor.js";
import { Product } from "../models/Product.js";
import { CommissionRecord } from "../models/CommissionRecord.js";
import { OrderItem } from "../models/OrderItem.js";
import mongoose from "mongoose";
import { Payment } from "../models/Payment.js";
import { Order } from "../models/Order.js";

export async function adminOverview() {
  const [revenueAgg, paidOrdersCount, ordersCount, usersCount, vendorsCount, productsCount, commissionAgg] = await Promise.all([
    Payment.aggregate([{ $match: { status: "captured", isTest: false } }, { $group: { _id: null, revenue: { $sum: "$amount" } } }]),
    Payment.countDocuments({ status: "captured", isTest: false }),
    Order.countDocuments({}),
    User.countDocuments({}),
    Vendor.countDocuments({}),
    Product.countDocuments({}),
    (async () => {
      const paidOrderIds = await Payment.distinct("orderId", { status: "captured", isTest: false });
      return CommissionRecord.aggregate([{ $match: { orderId: { $in: paidOrderIds } } }, { $group: { _id: null, commission: { $sum: "$amountCommission" } } }]);
    })()
  ]);
  return {
    revenue: revenueAgg[0]?.revenue ?? 0,
    commission: commissionAgg[0]?.commission ?? 0,
    orders: ordersCount,
    paidOrders: paidOrdersCount,
    users: usersCount,
    vendors: vendorsCount,
    products: productsCount
  };
}

export async function vendorOverview(vendorId: string) {
  const paidOrderIds = await Payment.distinct("orderId", { status: "captured", isTest: false });
  const [itemsAgg] = await Promise.all([
    OrderItem.aggregate([
      { $match: { vendorId: mongoose.Types.ObjectId.createFromHexString(vendorId), orderId: { $in: paidOrderIds } } },
      { $group: { _id: null, qty: { $sum: "$quantity" }, gross: { $sum: "$totalPrice" } } }
    ])
  ]);
  const grossSales = itemsAgg[0]?.gross ?? 0;
  return {
    revenue: grossSales,
    itemsSold: itemsAgg[0]?.qty ?? 0,
    grossSales
  };
}

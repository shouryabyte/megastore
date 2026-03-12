import http from "http";
import { connectDb } from "../config/db.js";
import { seedCategoriesIfEmpty } from "../config/seedCategories.js";
import { createApp } from "../app.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Vendor } from "../models/Vendor.js";
import { Product } from "../models/Product.js";
import { Inventory } from "../models/Inventory.js";
import { Cart } from "../models/Cart.js";
import { CartItem } from "../models/CartItem.js";
import { Order } from "../models/Order.js";
import { OrderItem } from "../models/OrderItem.js";
import { Payment } from "../models/Payment.js";
import { CommissionRecord } from "../models/CommissionRecord.js";
import bcrypt from "bcryptjs";

type Json = Record<string, any>;

function assert(cond: any, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function post(base: string, path: string, body: any, token?: string) {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const json = (await res.json().catch(() => null)) as Json | null;
  return { res, json };
}

async function patch(base: string, path: string, body: any, token?: string) {
  const res = await fetch(`${base}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  });
  const json = (await res.json().catch(() => null)) as Json | null;
  return { res, json };
}

async function del(base: string, path: string, token?: string) {
  const res = await fetch(`${base}${path}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const json = (await res.json().catch(() => null)) as Json | null;
  return { res, json };
}

async function get(base: string, path: string, token?: string) {
  const res = await fetch(`${base}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  const json = (await res.json().catch(() => null)) as Json | null;
  return { res, json };
}

function rand(prefix: string) {
  const s = Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${s}`;
}

async function main() {
  // Ensure env is loaded/validated
  assert(env.MONGO_URI, "Missing MONGO_URI");

  await connectDb();
  await seedCategoriesIfEmpty();

  const app = createApp();
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const addr = server.address();
  assert(addr && typeof addr !== "string", "Failed to bind server");
  const base = `http://127.0.0.1:${addr.port}`;

  const created: { userIds: string[]; vendorIds: string[]; productIds: string[]; orderIds: string[] } = {
    userIds: [],
    vendorIds: [],
    productIds: [],
    orderIds: []
  };

  try {
    const health = await get(base, "/api/health");
    assert(health.res.ok, `Health failed: ${health.res.status}`);

    // Create a temporary admin (direct DB), then login via API.
    const adminEmail = `${rand("admin")}@example.com`.toLowerCase();
    const adminPass = "StrongAdminPassword123!";
    const admin = await User.create({ name: "Admin", email: adminEmail, passwordHash: bcrypt.hashSync(adminPass, 12), role: "Admin" });
    created.userIds.push(admin._id.toString());

    const adminLogin = await post(base, "/api/auth/login", { email: adminEmail, password: adminPass });
    assert(adminLogin.res.ok, `Admin login failed: ${adminLogin.res.status} ${adminLogin.json?.error?.message ?? ""}`);
    const adminToken = adminLogin.json!.accessToken as string;
    assert(adminToken, "Admin access token missing");

    // Vendor register (pending)
    const vendorEmail = `${rand("vendor")}@example.com`.toLowerCase();
    const vendorPass = "VendorPassword123!";
    const vendorReg = await post(base, "/api/auth/register-vendor", { name: "Vendor Owner", storeName: `Store ${rand("nx")}`, email: vendorEmail, password: vendorPass });
    assert(vendorReg.res.ok, `Vendor register failed: ${vendorReg.res.status} ${vendorReg.json?.error?.message ?? ""}`);
    const vendorToken = vendorReg.json!.accessToken as string;
    const vendorId = vendorReg.json!.vendor?.id as string;
    assert(vendorToken && vendorId, "Vendor token/id missing");

    const vendorUser = await User.findOne({ email: vendorEmail }).lean();
    assert(vendorUser, "Vendor user not found");
    created.userIds.push(vendorUser!._id.toString());
    created.vendorIds.push(vendorId);

    // Ensure pending vendor cannot list products
    const vendorListBefore = await get(base, "/api/vendors/me/products", vendorToken);
    assert(vendorListBefore.res.status === 403, `Expected 403 for pending vendor, got ${vendorListBefore.res.status}`);

    // Approve vendor
    const approve = await post(base, `/api/admin/vendors/${vendorId}/approve`, {}, adminToken);
    assert(approve.res.ok, `Approve vendor failed: ${approve.res.status} ${approve.json?.error?.message ?? ""}`);

    // Create product as vendor
    const cats = await get(base, "/api/categories");
    assert(cats.res.ok, `List categories failed: ${cats.res.status}`);
    const catId = (cats.json!.items as any[]).find((c) => c.parentId)?.id ?? (cats.json!.items as any[])[0]?.id;
    assert(catId, "No category found");

    const prod = await post(
      base,
      "/api/vendors/me/products",
      {
        categoryId: catId,
        title: `Test Product ${rand("item")}`,
        brand: "NexChakra",
        modelNumber: "SMOKE-1",
        price: 999,
        mrp: 1299,
        sku: `SMK-${Date.now().toString(36).toUpperCase()}`,
        stock: 5
      },
      vendorToken
    );
    assert(prod.res.ok, `Create product failed: ${prod.res.status} ${prod.json?.error?.message ?? ""}`);
    const productId = prod.json!.productId as string;
    assert(productId, "Product id missing");
    created.productIds.push(productId);

    // Customer register + browse products
    const customerEmail = `${rand("cust")}@example.com`.toLowerCase();
    const customerPass = "CustomerPassword123!";
    const custReg = await post(base, "/api/auth/register", { name: "Customer", email: customerEmail, password: customerPass });
    assert(custReg.res.ok, `Customer register failed: ${custReg.res.status} ${custReg.json?.error?.message ?? ""}`);
    const customerToken = custReg.json!.accessToken as string;
    assert(customerToken, "Customer token missing");
    const custUser = await User.findOne({ email: customerEmail }).lean();
    assert(custUser, "Customer user missing");
    created.userIds.push(custUser!._id.toString());

    const list = await get(base, "/api/products?limit=5");
    assert(list.res.ok, `Product list failed: ${list.res.status}`);
    assert((list.json!.items as any[]).length >= 1, "Expected at least 1 product for customer");

    // Add to cart
    const addCart = await post(base, "/api/cart/items", { productId, quantity: 1 }, customerToken);
    assert(addCart.res.ok, `Add cart failed: ${addCart.res.status} ${addCart.json?.error?.message ?? ""}`);

    const cart = await get(base, "/api/cart", customerToken);
    assert(cart.res.ok, `Get cart failed: ${cart.res.status}`);
    assert((cart.json!.cart.items as any[]).length >= 1, "Cart should have item");

    // Create order from cart
    const orderCreate = await post(
      base,
      "/api/orders",
      {
        shippingAddress: {
          fullName: "Customer",
          phone: "9999999999",
          line1: "Line 1",
          city: "City",
          state: "State",
          country: "India",
          pincode: "751024"
        }
      },
      customerToken
    );
    assert(orderCreate.res.ok, `Create order failed: ${orderCreate.res.status} ${orderCreate.json?.error?.message ?? ""}`);
    const orderId = orderCreate.json!.order.id as string;
    created.orderIds.push(orderId);

    // Optional: payment provider call (requires real keys + network). We only validate amount shape if it succeeds.
    const pay = await post(base, "/api/payments/razorpay/order", { orderId }, customerToken);
    if (pay.res.ok) {
      assert(typeof pay.json!.amount === "number", "Payment amount missing");
      if (env.RAZORPAY_TEST_MODE) assert(pay.json!.amount === 1, "Expected test mode amount = 1");
    } else {
      // If keys/network are missing, we expect a provider error (not a 500 crash).
      assert(pay.res.status === 502 || pay.res.status === 400, `Unexpected payment create status ${pay.res.status}`);
    }

    // Vendor deletes the product (should disappear from catalog entirely).
    const prodDel = await del(base, `/api/vendors/me/products/${productId}`, vendorToken);
    assert(prodDel.res.ok, `Vendor delete product failed: ${prodDel.res.status} ${prodDel.json?.error?.message ?? ""}`);
    const prodGetAfter = await get(base, `/api/products/${prod.json!.slug ?? ""}`);
    assert(prodGetAfter.res.status === 404, `Expected 404 for deleted product, got ${prodGetAfter.res.status}`);

    console.log("SMOKE_OK");
  } finally {
    // Cleanup best-effort
    const userIds = created.userIds;
    const vendorIds = created.vendorIds;
    const productIds = created.productIds;
    const orderIds = created.orderIds;

    const carts = await Cart.find({ userId: { $in: userIds } }).select("_id").lean();
    const cartIds = carts.map((c) => c._id);

    await Promise.allSettled([
      CommissionRecord.deleteMany({ orderId: { $in: orderIds } }),
      Payment.deleteMany({ orderId: { $in: orderIds } }),
      OrderItem.deleteMany({ orderId: { $in: orderIds } }),
      Order.deleteMany({ _id: { $in: orderIds } }),
      CartItem.deleteMany({ cartId: { $in: cartIds } }),
      Cart.deleteMany({ userId: { $in: userIds } }),
      Inventory.deleteMany({ productId: { $in: productIds } }),
      Product.deleteMany({ _id: { $in: productIds } }),
      Vendor.deleteMany({ _id: { $in: vendorIds } }),
      User.deleteMany({ _id: { $in: userIds } })
    ]);

    await new Promise<void>((resolve) => server.close(() => resolve()));
    await (await import("mongoose")).default.disconnect();
  }
}

main().catch((err) => {
  console.error("SMOKE_FAIL", err);
  process.exit(1);
});

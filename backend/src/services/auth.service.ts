import bcrypt from "bcryptjs";
import { AppError } from "../utils/errors.js";
import { User } from "../models/User.js";
import { Vendor } from "../models/Vendor.js";
import { signAccessToken, signRefreshToken, type JwtRole } from "../utils/jwt.js";
import { slugify } from "../utils/slug.js";

async function ensureVendorLink(user: any) {
  if (user.role !== "Vendor") return;
  if (user.vendorId) return;
  const vendor = await Vendor.findOne({ userId: user._id }).select("_id").lean();
  if (!vendor) throw new AppError("Vendor account not found", 403, "VENDOR_NOT_FOUND");
  user.vendorId = vendor._id;
  await user.save();
}

export async function registerCustomer(input: { name: string; email: string; password: string }) {
  const role: JwtRole = "Customer";
  const existing = await User.findOne({ email: input.email.toLowerCase() }).lean();
  if (existing) throw new AppError("Email already in use", 409, "EMAIL_IN_USE");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role
  });
  const access = signAccessToken({ sub: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion });
  const refresh = signRefreshToken({ sub: user._id.toString(), role: user.role, tokenVersion: user.tokenVersion });
  const refreshTokenHash = await bcrypt.hash(refresh, 12);
  user.refreshTokenHash = refreshTokenHash;
  user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await user.save();
  return { user: sanitizeUser(user), access, refresh };
}

export async function registerVendor(input: { name: string; email: string; password: string; storeName: string }) {
  const existing = await User.findOne({ email: input.email.toLowerCase() }).lean();
  if (existing) throw new AppError("Email already in use", 409, "EMAIL_IN_USE");
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: "Vendor"
  });
  const baseSlug = slugify(input.storeName || input.name);
  const slug = `${baseSlug}-${user._id.toString().slice(-6)}`;
  const vendor = await Vendor.create({
    userId: user._id,
    displayName: input.storeName,
    storeSlug: slug,
    status: "pending"
  });
  user.vendorId = vendor._id;
  await user.save();
  const access = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    vendorId: vendor._id.toString(),
    tokenVersion: user.tokenVersion
  });
  const refresh = signRefreshToken({
    sub: user._id.toString(),
    role: user.role,
    vendorId: vendor._id.toString(),
    tokenVersion: user.tokenVersion
  });
  const refreshTokenHash = await bcrypt.hash(refresh, 12);
  user.refreshTokenHash = refreshTokenHash;
  user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await user.save();
  return { user: sanitizeUser(user), vendor, access, refresh };
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new AppError("Account not found", 404, "ACCOUNT_NOT_FOUND");
  if (user.isBlocked) throw new AppError("Forbidden", 403, "BLOCKED");
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) throw new AppError("Incorrect password", 401, "INVALID_PASSWORD");

  await ensureVendorLink(user);

  const access = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    vendorId: user.vendorId?.toString(),
    tokenVersion: user.tokenVersion
  });
  const refresh = signRefreshToken({
    sub: user._id.toString(),
    role: user.role,
    vendorId: user.vendorId?.toString(),
    tokenVersion: user.tokenVersion
  });
  user.refreshTokenHash = await bcrypt.hash(refresh, 12);
  user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await user.save();
  return { user: sanitizeUser(user), access, refresh };
}

export async function rotateRefresh(userId: string, refreshToken: string) {
  const user = await User.findById(userId);
  if (!user || !user.refreshTokenHash || user.isBlocked) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() < Date.now()) {
    throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
  }
  const match = await bcrypt.compare(refreshToken, user.refreshTokenHash);
  if (!match) throw new AppError("Unauthorized", 401, "UNAUTHORIZED");

  await ensureVendorLink(user);

  const access = signAccessToken({
    sub: user._id.toString(),
    role: user.role,
    vendorId: user.vendorId?.toString(),
    tokenVersion: user.tokenVersion
  });
  const newRefresh = signRefreshToken({
    sub: user._id.toString(),
    role: user.role,
    vendorId: user.vendorId?.toString(),
    tokenVersion: user.tokenVersion
  });
  user.refreshTokenHash = await bcrypt.hash(newRefresh, 12);
  user.refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  await user.save();
  return { user: sanitizeUser(user), access, refresh: newRefresh };
}

export async function logout(userId: string) {
  await User.findByIdAndUpdate(userId, { $unset: { refreshTokenHash: 1, refreshTokenExpiresAt: 1 }, $inc: { tokenVersion: 1 } });
}

export function sanitizeUser(user: { _id: any; name: string; email: string; role: string; vendorId?: any }) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    vendorId: user.vendorId ? user.vendorId.toString() : undefined
  };
}

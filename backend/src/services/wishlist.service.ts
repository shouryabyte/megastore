import { Wishlist } from "../models/Wishlist.js";

export async function getWishlist(userId: string) {
  const wl = await Wishlist.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { upsert: true, new: true })
    .populate("productIds")
    .lean();
  return {
    id: wl._id.toString(),
    items: (wl.productIds as any[]).map((p) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      price: p.price,
      brand: p.brand
    }))
  };
}

export async function addToWishlist(userId: string, productId: string) {
  await Wishlist.findOneAndUpdate({ userId }, { $setOnInsert: { userId }, $addToSet: { productIds: productId } }, { upsert: true, new: true });
  return getWishlist(userId);
}

export async function removeFromWishlist(userId: string, productId: string) {
  await Wishlist.findOneAndUpdate({ userId }, { $pull: { productIds: productId } }, { new: true });
  return getWishlist(userId);
}


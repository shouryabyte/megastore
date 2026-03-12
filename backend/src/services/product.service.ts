import { Product } from "../models/Product.js";
import { Category } from "../models/Category.js";
import { Vendor } from "../models/Vendor.js";
import { AppError } from "../utils/errors.js";
import { slugify } from "../utils/slug.js";
import { ProductImage } from "../models/ProductImage.js";
import { Inventory } from "../models/Inventory.js";

async function resolveCategoryId(category: string): Promise<string | null> {
  if (!category) return null;
  const trimmed = category.trim();
  if (!trimmed) return null;
  if (/^[a-fA-F0-9]{24}$/.test(trimmed)) return trimmed;
  const byName = await Category.findOne({ isActive: true, name: new RegExp(`^${escapeRegExp(trimmed)}$`, "i") })
    .select("_id")
    .lean();
  if (byName?._id) return byName._id.toString();
  const bySlug = await Category.findOne({ isActive: true, slug: trimmed }).select("_id").lean();
  return bySlug?._id ? bySlug._id.toString() : null;
}

function mapAggProduct(p: any) {
  return {
    id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    brand: p.brand,
    modelNumber: p.modelNumber,
    price: p.price,
    mrp: p.mrp,
    bulkPricing: p.bulkPricing ?? [],
    ratingAvg: p.ratingAvg ?? 0,
    ratingCount: p.ratingCount ?? 0,
    vendorId: p.vendorId.toString(),
    vendorName: p.vendor?.displayName ?? null,
    vendorStoreSlug: p.vendor?.storeSlug ?? null,
    categoryId: p.categoryId.toString(),
    images: (p.images ?? []).map((img: any) => ({ id: img._id.toString(), url: img.url, alt: img.alt, sortOrder: img.sortOrder ?? 0 })),
    inventory: p.inventory ? { quantity: p.inventory.quantity, lowStockThreshold: p.inventory.lowStockThreshold } : null
  };
}

async function listForHomepage(input: { match: any; sort: any; limit: number }) {
  const limit = Math.min(48, Math.max(1, input.limit));
  const pipeline: any[] = [
    { $match: { isActive: true, ...input.match } },
    {
      $lookup: {
        from: "vendors",
        localField: "vendorId",
        foreignField: "_id",
        as: "vendor"
      }
    },
    { $unwind: "$vendor" },
    { $match: { "vendor.status": "approved" } },
    { $sort: input.sort },
    { $limit: limit },
    {
      $lookup: {
        from: "productimages",
        localField: "imageIds",
        foreignField: "_id",
        as: "images"
      }
    },
    {
      $lookup: {
        from: "inventories",
        localField: "_id",
        foreignField: "productId",
        as: "inventory"
      }
    },
    { $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true } }
  ];

  const items = await Product.aggregate(pipeline);
  return items.map(mapAggProduct);
}

export async function listProducts(input: {
  q?: string;
  category?: string;
  vendor?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  compatibility?: string;
  specs?: Record<string, string>;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, input.page ?? 1);
  const limit = Math.min(48, Math.max(1, input.limit ?? 24));
  const skip = (page - 1) * limit;

  const filter: any = { isActive: true };
  if (input.q) filter.$text = { $search: input.q };
  if (input.category) {
    const categoryId = await resolveCategoryId(input.category);
    if (!categoryId) return { page, limit, total: 0, items: [] as any[] };
    filter.categoryId = categoryId;
  }
  if (input.vendor) filter.vendorId = input.vendor;
  if (input.brand) filter.brand = new RegExp(`^${escapeRegExp(input.brand)}$`, "i");
  if (input.compatibility) filter.compatibility = input.compatibility;
  if (typeof input.minPrice === "number" || typeof input.maxPrice === "number") {
    filter.price = {};
    if (typeof input.minPrice === "number") filter.price.$gte = input.minPrice;
    if (typeof input.maxPrice === "number") filter.price.$lte = input.maxPrice;
  }
  if (input.specs && Object.keys(input.specs).length) {
    for (const [k, v] of Object.entries(input.specs)) filter[`specs.${k}`] = v;
  }

  // Only approved vendors can sell/browseable products.
  if (input.vendor) {
    const v = await Vendor.findOne({ _id: input.vendor, status: "approved" }).select("_id").lean();
    if (!v) return { page, limit, total: 0, items: [] as any[] };
  }

  const baseMatch = filter;
  const sort = input.q
    ? ({ score: { $meta: "textScore" as const } } as any)
    : ({ isFeatured: -1, sponsoredRank: -1, createdAt: -1 } as any);
  const addScore = input.q ? [{ $addFields: { score: { $meta: "textScore" } } }] : [];

  const pipeline: any[] = [
    { $match: baseMatch },
    ...addScore,
    {
      $lookup: {
        from: "vendors",
        localField: "vendorId",
        foreignField: "_id",
        as: "vendor"
      }
    },
    { $unwind: "$vendor" },
    { $match: { "vendor.status": "approved" } },
    { $sort: sort },
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "productimages",
              localField: "imageIds",
              foreignField: "_id",
              as: "images"
            }
          },
          {
            $lookup: {
              from: "inventories",
              localField: "_id",
              foreignField: "productId",
              as: "inventory"
            }
          },
          { $unwind: { path: "$inventory", preserveNullAndEmptyArrays: true } }
        ],
        total: [{ $count: "count" }]
      }
    }
  ];

  const agg = await Product.aggregate(pipeline);
  const items = agg?.[0]?.items ?? [];
  const total = agg?.[0]?.total?.[0]?.count ?? 0;

  return {
    page,
    limit,
    total,
    items: items.map(mapAggProduct)
  };
}

export async function getProductBySlug(slug: string) {
  const product = await Product.findOne({ slug, isActive: true }).populate("imageIds").lean();
  if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
  const [vendor, category, inventory] = await Promise.all([
    Vendor.findOne({ _id: product.vendorId, status: "approved" }).select("displayName storeSlug ratingAvg ratingCount status logoUrl").lean(),
    Category.findById(product.categoryId).select("name slug").lean(),
    Inventory.findOne({ productId: product._id }).select("quantity lowStockThreshold sku").lean()
  ]);
  if (!vendor) throw new AppError("Product not found", 404, "NOT_FOUND");
  return {
    id: product._id.toString(),
    title: product.title,
    slug: product.slug,
    brand: product.brand,
    modelNumber: product.modelNumber,
    description: product.description,
    price: product.price,
    mrp: product.mrp,
    bulkPricing: product.bulkPricing,
    specs: product.specs,
    compatibility: product.compatibility,
    tags: product.tags,
    ratingAvg: product.ratingAvg,
    ratingCount: product.ratingCount,
    vendor: { id: vendor._id.toString(), displayName: vendor.displayName, storeSlug: vendor.storeSlug, ratingAvg: vendor.ratingAvg, ratingCount: vendor.ratingCount, logoUrl: vendor.logoUrl },
    category: category ? { id: category._id.toString(), name: category.name, slug: category.slug } : null,
    images: (product.imageIds ?? []).filter(Boolean).map((img: any) => ({ id: img._id.toString(), url: img.url, alt: img.alt, sortOrder: img.sortOrder })),
    inventory: inventory ? { quantity: inventory.quantity, lowStockThreshold: inventory.lowStockThreshold, sku: inventory.sku } : null
  };
}

export async function createProduct(input: {
  vendorId: string;
  categoryId: string;
  title: string;
  brand: string;
  modelNumber?: string;
  description?: string;
  price: number;
  mrp?: number;
  bulkPricing?: { minQty: number; price: number }[];
  specs?: Record<string, string>;
  compatibility?: string[];
  tags?: string[];
}) {
  const slug = `${slugify(input.title)}-${Date.now().toString(36)}`;
  const product = await Product.create({
    vendorId: input.vendorId,
    categoryId: input.categoryId,
    title: input.title,
    slug,
    brand: input.brand,
    modelNumber: input.modelNumber,
    description: input.description,
    price: input.price,
    mrp: input.mrp,
    bulkPricing: (input.bulkPricing ?? []).sort((a, b) => a.minQty - b.minQty),
    specs: input.specs ?? {},
    compatibility: input.compatibility ?? [],
    tags: input.tags ?? []
  });
  return product;
}

export async function updateProduct(vendorId: string, productId: string, patch: Partial<Omit<Parameters<typeof createProduct>[0], "vendorId">>) {
  const product = await Product.findOne({ _id: productId, vendorId });
  if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
  if (patch.title) product.title = patch.title;
  if (patch.brand) product.brand = patch.brand;
  if (typeof patch.price === "number") product.price = patch.price;
  if (typeof patch.mrp === "number") product.mrp = patch.mrp;
  if (patch.modelNumber !== undefined) product.modelNumber = patch.modelNumber;
  if (patch.description !== undefined) product.description = patch.description;
  if (patch.bulkPricing) product.bulkPricing = patch.bulkPricing.sort((a, b) => a.minQty - b.minQty) as any;
  if (patch.compatibility) product.compatibility = patch.compatibility as any;
  if (patch.tags) product.tags = patch.tags as any;
  if (patch.specs) product.specs = patch.specs as any;
  if (patch.categoryId) product.categoryId = patch.categoryId as any;
  await product.save();
  return product;
}

export async function addProductImage(input: { vendorId: string; productId: string; url: string; publicId: string; alt?: string; sortOrder?: number }) {
  const product = await Product.findOne({ _id: input.productId, vendorId: input.vendorId });
  if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
  const img = await ProductImage.create({
    productId: input.productId,
    vendorId: input.vendorId,
    url: input.url,
    publicId: input.publicId,
    alt: input.alt,
    sortOrder: input.sortOrder ?? 0
  });
  product.imageIds.push(img._id);
  await product.save();
  return img;
}

export async function removeProductImage(input: { vendorId: string; productId: string; imageId: string }) {
  const product = await Product.findOne({ _id: input.productId, vendorId: input.vendorId });
  if (!product) throw new AppError("Product not found", 404, "NOT_FOUND");
  await ProductImage.deleteOne({ _id: input.imageId, productId: input.productId, vendorId: input.vendorId });
  product.imageIds = product.imageIds.filter((id) => id.toString() !== input.imageId) as any;
  await product.save();
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listFeaturedProducts(limit: number) {
  return listForHomepage({ match: { isFeatured: true }, sort: { sponsoredRank: -1, createdAt: -1 }, limit });
}

export async function listLatestProducts(limit: number) {
  return listForHomepage({ match: {}, sort: { createdAt: -1 }, limit });
}

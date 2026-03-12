export type ProductListItem = {
  id: string;
  title: string;
  slug: string;
  brand: string;
  modelNumber?: string;
  price: number;
  mrp?: number;
  bulkPricing: { minQty: number; price: number }[];
  ratingAvg: number;
  ratingCount: number;
  vendorId: string;
  vendorName?: string | null;
  vendorStoreSlug?: string | null;
  categoryId: string;
  images: { id: string; url: string; alt?: string; sortOrder: number }[];
  inventory: { quantity: number; lowStockThreshold: number } | null;
};

export type ProductDetail = {
  id: string;
  title: string;
  slug: string;
  brand: string;
  modelNumber?: string;
  description?: string;
  price: number;
  mrp?: number;
  bulkPricing: { minQty: number; price: number }[];
  specs: Record<string, string>;
  compatibility: string[];
  tags: string[];
  ratingAvg: number;
  ratingCount: number;
  images: { id: string; url: string; alt?: string; sortOrder: number }[];
  inventory: { quantity: number; lowStockThreshold: number; sku: string } | null;
  vendor: { id: string; displayName: string; storeSlug: string; ratingAvg: number; ratingCount: number; logoUrl?: string } | null;
  category: { id: string; name: string; slug: string } | null;
};

export type ReviewItem = {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  customer: { id: string; name: string } | null;
  createdAt: string;
};

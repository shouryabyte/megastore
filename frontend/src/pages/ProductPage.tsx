import { useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Heart, Store, ShieldCheck } from "lucide-react";
import { api } from "@/services/api";
import type { ProductDetail, ReviewItem } from "@/types/api";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { RatingStars } from "@/components/RatingStars";
import { Money } from "@/components/Money";
import { useCartMutations } from "@/hooks/useCart";
import { useWishlist, useWishlistMutations } from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/auth";
import { Input } from "@/components/ui/input";

export function ProductPage() {
  const { slug } = useParams();
  const nav = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [qty, setQty] = useState(1);
  const cart = useCartMutations();
  const wishlist = useWishlist();
  const wlMut = useWishlistMutations();

  const productQ = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => (await api.get(`/products/${slug}`)).data.product as ProductDetail,
    enabled: !!slug
  });

  const product = productQ.data;
  const inWl = product ? (wishlist.data?.items?.some((x: any) => x.id === product.id) ?? false) : false;

  const reviewsQ = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: async () => (await api.get(`/reviews/product/${product!.id}`)).data.items as ReviewItem[],
    enabled: !!product?.id
  });

  const images = useMemo(() => (product?.images ?? []).slice().sort((a, b) => a.sortOrder - b.sortOrder), [product?.images]);
  const [active, setActive] = useState(0);

  if (productQ.isLoading) return <div className="container py-8 text-sm text-muted-foreground">Loading…</div>;
  if (!product) return <div className="container py-8 text-sm text-muted-foreground">Not found</div>;

  const stock = product.inventory?.quantity ?? null;
  const canBuy = stock === null ? true : stock > 0;

  return (
    <div className="container py-8">
      <div className="mb-4 text-xs text-muted-foreground">
        <Link to="/products" className="hover:underline">
          Products
        </Link>{" "}
        / <span className="text-foreground">{product.title}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid gap-0 md:grid-cols-[110px_1fr]">
              <div className="order-2 flex gap-2 overflow-auto border-t border-border p-3 md:order-1 md:flex-col md:border-r md:border-t-0">
                {images.length ? (
                  images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setActive(i)}
                      className={`aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-lg border ${i === active ? "border-blue-500" : "border-border"} bg-background/30`}
                      title={img.alt ?? product.title}
                    >
                      <img src={img.url} alt={img.alt ?? product.title} className="h-full w-full object-contain p-2" />
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No images</div>
                )}
              </div>
              <div className="order-1 flex items-center justify-center bg-secondary/40 p-6 md:order-2">
                {images[active]?.url ? (
                  <img src={images[active].url} alt={images[active].alt ?? product.title} className="max-h-[420px] w-full object-contain" />
                ) : (
                  <div className="text-sm text-muted-foreground">No image</div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{product.brand}</Badge>
                {product.modelNumber && <Badge variant="outline">Model: {product.modelNumber}</Badge>}
                {stock !== null && stock <= 5 && stock > 0 && <Badge variant="primary">Only {stock} left</Badge>}
                {stock !== null && stock <= 0 && <Badge variant="outline">Out of stock</Badge>}
              </div>
              <div className="text-2xl font-bold tracking-tight">{product.title}</div>
              <div className="flex items-center justify-between gap-2">
                <RatingStars value={product.ratingAvg} count={product.ratingCount} />
                <div className="text-xs text-muted-foreground">
                  <ShieldCheck className="mr-1 inline h-4 w-4 text-blue-600" />
                  Verified marketplace flow
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-3xl font-extrabold">
                    <Money value={product.price} />
                  </div>
                  {product.mrp && product.mrp > product.price && (
                    <div className="text-sm text-muted-foreground">
                      MRP <span className="line-through">₹{product.mrp.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <div className="w-28">
                  <div className="text-xs font-semibold text-muted-foreground">Quantity</div>
                  <Input type="number" min={1} max={50} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(50, Number(e.target.value || 1))))} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={!user || !canBuy || cart.add.isPending} onClick={() => cart.add.mutate({ productId: product.id, quantity: qty })} className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Add to cart
                </Button>
                <Button
                  variant="outline"
                  disabled={!user}
                  onClick={() => (inWl ? wlMut.remove.mutate(product.id) : wlMut.add.mutate(product.id))}
                  className="gap-2"
                >
                  <Heart className={`h-4 w-4 ${inWl ? "fill-blue-600 text-blue-600" : ""}`} />
                  Wishlist
                </Button>
                <Button variant="secondary" onClick={() => nav("/cart")}>
                  Go to cart
                </Button>
              </div>

              {product.vendor && (
                <div className="rounded-xl border border-border bg-card/40 p-4 backdrop-blur">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Sold by</div>
                      <div className="text-sm font-semibold">{product.vendor.displayName}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        Rating {product.vendor.ratingAvg.toFixed(1)} • {product.vendor.ratingCount} reviews
                      </div>
                    </div>
                    <Button asChild variant="outline" size="sm" className="gap-2">
                      <Link to={`/store/${product.vendor.storeSlug}`}>
                        <Store className="h-4 w-4" />
                        Storefront
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <Tabs defaultValue="specs">
                <TabsList>
                  <TabsTrigger value="specs">Specifications</TabsTrigger>
                  <TabsTrigger value="bulk">Bulk tiers</TabsTrigger>
                  <TabsTrigger value="reviews">Reviews</TabsTrigger>
                </TabsList>
                <TabsContent value="specs">
                  {product.description && <div className="mb-3 text-sm text-muted-foreground">{product.description}</div>}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(product.specs ?? {}).slice(0, 24).map(([k, v]) => (
                      <div key={k} className="rounded-lg border border-border bg-card/30 p-3">
                        <div className="text-xs text-muted-foreground">{k}</div>
                        <div className="text-sm font-medium">{v}</div>
                      </div>
                    ))}
                    {!Object.keys(product.specs ?? {}).length && <div className="text-sm text-muted-foreground">No specifications provided.</div>}
                  </div>
                  {!!product.compatibility?.length && (
                    <>
                      <Separator className="my-4" />
                      <div className="text-sm font-semibold">Compatibility</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {product.compatibility.slice(0, 18).map((c) => (
                          <Badge key={c} variant="outline">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </TabsContent>
                <TabsContent value="bulk">
                  <div className="text-sm text-muted-foreground">Bulk pricing tiers (auto-calculated per quantity at checkout).</div>
                  <div className="mt-3 overflow-hidden rounded-xl border border-border">
                    <div className="grid grid-cols-2 bg-card/40 px-4 py-2 text-xs font-semibold text-muted-foreground">
                      <div>Min quantity</div>
                      <div className="text-right">Unit price</div>
                    </div>
                    {(product.bulkPricing ?? []).length ? (
                      product.bulkPricing.map((t) => (
                        <div key={t.minQty} className="grid grid-cols-2 px-4 py-3 text-sm">
                          <div>{t.minQty}+</div>
                          <div className="text-right">₹{t.price.toFixed(2)}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-muted-foreground">No bulk tiers configured.</div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="reviews">
                  <div className="space-y-3">
                    {(reviewsQ.data ?? []).map((r) => (
                      <div key={r.id} className="rounded-xl border border-border bg-card/30 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-sm font-semibold">{r.customer?.name ?? "Customer"}</div>
                          <RatingStars value={r.rating} />
                        </div>
                        {r.title && <div className="mt-1 text-sm font-medium">{r.title}</div>}
                        {r.comment && <div className="mt-1 text-sm text-muted-foreground">{r.comment}</div>}
                      </div>
                    ))}
                    {!reviewsQ.isLoading && !(reviewsQ.data ?? []).length && <div className="text-sm text-muted-foreground">No reviews yet.</div>}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

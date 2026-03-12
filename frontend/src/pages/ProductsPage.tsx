import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "@/services/api";
import { ProductCard } from "@/components/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ProductsPage() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get("q") ?? "";
  const category = sp.get("category") ?? "";
  const brand = sp.get("brand") ?? "";
  const minPrice = sp.get("minPrice") ?? "";
  const maxPrice = sp.get("maxPrice") ?? "";
  const [compatibility, setCompatibility] = useState(sp.get("compatibility") ?? "");

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (compatibility) params.set("compatibility", compatibility);
    params.set("limit", "24");
    return params.toString();
  }, [q, category, brand, minPrice, maxPrice, compatibility]);

  const products = useQuery({
    queryKey: ["products", queryParams],
    queryFn: async () => (await api.get(`/products?${queryParams}`)).data
  });

  return (
    <div className="container py-8">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-bold tracking-tight">Search</div>
          <div className="text-sm text-muted-foreground">Filter by brand, price, compatibility and specs</div>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          {q && <Badge variant="outline">“{q}”</Badge>}
          {category && <Badge variant="outline">{category}</Badge>}
          {brand && <Badge variant="outline">{brand}</Badge>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="text-sm font-semibold">Brand</div>
              <Input
                value={brand}
                onChange={(e) => {
                  const next = new URLSearchParams(sp);
                  if (e.target.value) next.set("brand", e.target.value);
                  else next.delete("brand");
                  setSp(next);
                }}
                placeholder="e.g., Dell, Samsung"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-sm font-semibold">Min price</div>
                <Input
                  value={minPrice}
                  onChange={(e) => {
                    const next = new URLSearchParams(sp);
                    if (e.target.value) next.set("minPrice", e.target.value);
                    else next.delete("minPrice");
                    setSp(next);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold">Max price</div>
                <Input
                  value={maxPrice}
                  onChange={(e) => {
                    const next = new URLSearchParams(sp);
                    if (e.target.value) next.set("maxPrice", e.target.value);
                    else next.delete("maxPrice");
                    setSp(next);
                  }}
                  placeholder="99999"
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-semibold">Compatibility</div>
              <Input value={compatibility} onChange={(e) => setCompatibility(e.target.value)} placeholder="e.g., iPhone 12, DJI" />
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  const next = new URLSearchParams(sp);
                  if (compatibility) next.set("compatibility", compatibility);
                  else next.delete("compatibility");
                  setSp(next);
                }}
              >
                Apply
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCompatibility("");
                  setSp({});
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          {products.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : products.data?.items?.length ? (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{products.data.items.length}</span> of{" "}
                <span className="font-medium text-foreground">{products.data.total}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {products.data.items.map((p: any) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent>
                <div className="text-sm font-semibold">No results</div>
                <div className="mt-1 text-sm text-muted-foreground">Try a broader search or remove filters.</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


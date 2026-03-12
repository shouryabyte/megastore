import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { ProductCard } from "@/components/ProductCard";
import { Card, CardContent } from "@/components/ui/card";
import { RatingStars } from "@/components/RatingStars";

export function VendorStorefrontPage() {
  const { slug } = useParams();
  const q = useQuery({
    queryKey: ["store", slug],
    queryFn: async () => (await api.get(`/vendors/store/${slug}`)).data,
    enabled: !!slug
  });

  if (q.isLoading) return <div className="container py-8 text-sm text-muted-foreground">Loading…</div>;
  if (!q.data) return <div className="container py-8 text-sm text-muted-foreground">Not found</div>;

  return (
    <div className="container py-8">
      <Card>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Vendor</div>
            <div className="text-2xl font-bold tracking-tight">{q.data.vendor.displayName}</div>
            {q.data.vendor.description && <div className="mt-1 max-w-2xl text-sm text-muted-foreground">{q.data.vendor.description}</div>}
            <div className="mt-2">
              <RatingStars value={q.data.vendor.ratingAvg} count={q.data.vendor.ratingCount} />
            </div>
          </div>
          {q.data.vendor.logoUrl && <img src={q.data.vendor.logoUrl} className="h-16 w-16 rounded-xl border border-border object-cover" alt={q.data.vendor.displayName} />}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {q.data.products.map((p: any) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}


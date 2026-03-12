import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import type { ProductListItem } from "@/types/api";

export function HomePage() {
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [featured, setFeatured] = useState<ProductListItem[]>([]);
  const [latest, setLatest] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const [catsRes, featuredRes, latestRes] = await Promise.all([api.get("/categories"), api.get("/products/featured?limit=12"), api.get("/products/latest?limit=12")]);
        if (!alive) return;
        setCategories((catsRes.data?.items as any[])?.map((c) => ({ id: c.id, name: c.name, slug: c.slug })) ?? []);
        setFeatured((featuredRes.data?.items as ProductListItem[]) ?? []);
        setLatest((latestRes.data?.items as ProductListItem[]) ?? []);
      } catch {
        if (!alive) return;
        setCategories([]);
        setFeatured([]);
        setLatest([]);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const featuredForGrid = useMemo(() => (featured.length ? featured : latest), [featured, latest]);

  return (
    <div>
      <section className="bg-grid">
        <div className="container py-10 md:py-14">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-2 text-xs text-muted-foreground shadow-soft backdrop-blur"
              >
                <Sparkles className="h-4 w-4 text-blue-600" />
                Real-time inventory • Secure payments • Multi-vendor
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold tracking-tight md:text-5xl">
                Electronics, drone parts & AC components — <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">fast</span> and{" "}
                <span className="bg-gradient-to-r from-indigo-600 to-fuchsia-600 bg-clip-text text-transparent">reliable</span>.
              </motion.h1>
              <p className="max-w-xl text-base text-muted-foreground">
                Discover verified vendors, deep specifications, bulk pricing tiers, and lightning-quick checkout powered by Razorpay.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="h-11">
                  <Link to="/products">
                    Browse products <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="h-11">
                  <Link to="/auth">Become a vendor</Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 md:grid-cols-4">
                <Feature
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Verified Vendors"
                  desc="Every seller is verified to ensure authentic electronic components and reliable suppliers."
                />
                <Feature
                  icon={<Zap className="h-4 w-4" />}
                  title="Bulk Pricing"
                  desc="Get better pricing for large orders with transparent bulk quantity tiers."
                />
                <Feature icon={<Truck className="h-4 w-4" />} title="Fast Procurement" desc="Quickly find parts using model numbers, specifications, and category filters." />
                <Feature
                  icon={<Sparkles className="h-4 w-4" />}
                  title="Secure Checkout"
                  desc="Safe payments powered by Razorpay with order tracking and invoice generation."
                />
              </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-fuchsia-600/10 blur-2xl" />
              <div className="glass relative overflow-hidden rounded-[2rem] p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Trending today</div>
                  <Link to="/products" className="text-xs text-blue-400 hover:underline">
                    View all
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {loading ? (
                    Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[52px] w-full rounded-xl" />)
                  ) : categories.length ? (
                    categories.slice(0, 6).map((c) => (
                      <Link
                        key={c.id}
                        to={`/products?category=${encodeURIComponent(c.name)}`}
                        className="rounded-xl border border-border bg-card/40 p-4 text-sm font-medium shadow-sm transition hover:bg-card/70"
                      >
                        {c.name}
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-2 rounded-xl border border-border bg-card/40 p-4 text-sm text-muted-foreground">No categories available.</div>
                  )}
                </div>
                <div className="mt-5 rounded-xl bg-card/40 p-4">
                  <div className="text-xs text-muted-foreground">Pro tip</div>
                  <div className="mt-1 text-sm font-semibold">Search by model number or specs (e.g., “ATmega328”, “5V relay”, “ESC 30A”).</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="container py-10">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">Featured picks</div>
            <div className="text-sm text-muted-foreground">Fresh inventory from approved vendors</div>
          </div>
          <Button asChild variant="outline">
            <Link to="/products">Explore</Link>
          </Button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : featuredForGrid.length ? (
            featuredForGrid.slice(0, 12).map((p) => <ProductCard key={p.id} p={p} />)
          ) : (
            <Card className="sm:col-span-2 lg:col-span-4">
              <div className="p-6">
                <div className="text-sm font-semibold">No products available</div>
                <div className="mt-1 text-sm text-muted-foreground">Approved vendors haven’t listed products yet.</div>
              </div>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <span className="text-blue-600">{icon}</span>
        {title}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}

function ProductCardSkeleton() {
  return (
    <Card className="group overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4">
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-2 flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <div className="mt-4 flex items-end justify-between gap-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </Card>
  );
}

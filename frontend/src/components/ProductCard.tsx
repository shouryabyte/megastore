import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingCart } from "lucide-react";
import type { ProductListItem } from "@/types/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/RatingStars";
import { Money } from "@/components/Money";
import { cn } from "@/lib/utils";
import { useCartMutations } from "@/hooks/useCart";
import { useWishlist, useWishlistMutations } from "@/hooks/useWishlist";
import { useAuthStore } from "@/store/auth";

export function ProductCard({ p }: { p: ProductListItem }) {
  const user = useAuthStore((s) => s.user);
  const canShop = user?.role === "Customer";
  const cart = useCartMutations();
  const wishlist = useWishlist();
  const wlMut = useWishlistMutations();
  const inWl = wishlist.data?.items?.some((x: any) => x.id === p.id) ?? false;
  const primaryImg = [...(p.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)[0]?.url;
  const stock = p.inventory?.quantity ?? null;

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 250, damping: 20 }}>
      <Card className="group overflow-hidden">
        <div className="relative aspect-[4/3] bg-secondary/40">
          {primaryImg ? (
            <img src={primaryImg} alt={p.title} className="h-full w-full object-contain p-4 transition group-hover:scale-[1.02]" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No image</div>
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            {stock !== null && stock <= 5 && <Badge variant="outline">Low stock</Badge>}
            {p.mrp && p.mrp > p.price && <Badge variant="primary">{Math.round(((p.mrp - p.price) / p.mrp) * 100)}% off</Badge>}
          </div>
          <div className="absolute right-3 top-3">
            <Button
              size="icon"
              variant="outline"
              className={cn("h-9 w-9 rounded-full bg-background/60 backdrop-blur", inWl && "border-blue-500")}
              disabled={!canShop}
              onClick={() => (inWl ? wlMut.remove.mutate(p.id) : wlMut.add.mutate(p.id))}
              title={canShop ? "Wishlist" : "Customers only"}
            >
              <Heart className={cn("h-4 w-4", inWl ? "fill-blue-500 text-blue-500" : "")} />
            </Button>
          </div>
        </div>
        <div className="p-4">
          <Link to={`/p/${p.slug}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:underline">
            {p.title}
          </Link>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="text-xs text-muted-foreground">
              {p.brand}
              {p.vendorName ? <span className="opacity-80"> {"\u2022"} {p.vendorName}</span> : null}
            </div>
            <RatingStars value={p.ratingAvg} count={p.ratingCount} />
          </div>
          <div className="mt-3 flex items-end justify-between gap-2">
            <div className="space-y-0.5">
              <div className="text-lg font-bold">
                <Money value={p.price} />
              </div>
              {p.mrp && p.mrp > p.price && <div className="text-xs text-muted-foreground line-through">₹{p.mrp.toFixed(2)}</div>}
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="gap-2"
              disabled={!canShop || (stock !== null && stock <= 0) || cart.add.isPending}
              onClick={() => cart.add.mutate({ productId: p.id, quantity: 1 })}
            >
              <ShoppingCart className="h-4 w-4" />
              Add
            </Button>
          </div>
          {stock !== null && stock <= 0 && <div className="mt-2 text-xs font-medium text-destructive">Out of stock</div>}
        </div>
      </Card>
    </motion.div>
  );
}

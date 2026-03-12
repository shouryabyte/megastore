import { Link } from "react-router-dom";
import { useWishlist, useWishlistMutations } from "@/hooks/useWishlist";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/auth";

export function WishlistPage() {
  const { user } = useAuthStore();
  const wl = useWishlist();
  const mut = useWishlistMutations();

  if (!user) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent>
            <div className="text-sm font-semibold">Sign in required</div>
            <div className="mt-1 text-sm text-muted-foreground">Please sign in to use wishlist.</div>
            <div className="mt-4">
              <Button asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold">Wishlist</div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(wl.data?.items ?? []).map((p: any) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
              <div className="min-w-0">
                <Link className="line-clamp-1 text-sm font-semibold hover:underline" to={`/p/${p.slug}`}>
                  {p.title}
                </Link>
                <div className="text-sm text-muted-foreground">₹{p.price.toFixed(2)}</div>
              </div>
              <Button variant="outline" onClick={() => mut.remove.mutate(p.id)}>
                Remove
              </Button>
            </div>
          ))}
          {!wl.isLoading && !(wl.data?.items ?? []).length && <div className="text-sm text-muted-foreground">No items saved yet.</div>}
        </CardContent>
      </Card>
    </div>
  );
}


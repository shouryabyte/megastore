import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, Heart, Search, User, LayoutDashboard, LogOut, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth";
import { useCart } from "@/hooks/useCart";
import { api } from "@/services/api";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function Header() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const q = sp.get("q") ?? "";
  const [search, setSearch] = useState(q);
  const { user, clear } = useAuthStore();
  const cart = useCart();
  const count = cart.data?.items?.reduce((s: number, it: any) => s + (it.quantity ?? 0), 0) ?? 0;

  useEffect(() => setSearch(q), [q]);

  return (
    <div className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="container">
        <div className="flex h-16 items-center gap-3">
          <Link to="/" className="group flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 via-indigo-500 to-fuchsia-500 shadow-soft ring-1 ring-white/10" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">NexChakra</div>
              <div className="text-[11px] text-muted-foreground">Mega Store</div>
            </div>
          </Link>

          <div className="hidden flex-1 md:block">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!search.trim()) return;
                navigate(`/products?q=${encodeURIComponent(search.trim())}`);
              }}
              className="relative"
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by product, model number, specifications…"
                className="h-11 pl-10"
              />
              <motion.div
                className="pointer-events-none absolute inset-y-0 right-0 w-24 rounded-r-lg bg-gradient-to-r from-transparent to-background"
                initial={{ opacity: 0 }}
                animate={{ opacity: search ? 0 : 1 }}
              />
            </form>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" className="hidden md:inline-flex" onClick={() => navigate("/wishlist")}>
              <Heart className="h-4 w-4" />
              Wishlist
            </Button>

            <Button variant="ghost" className="relative" onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Cart</span>
              <span
                className={cn(
                  "absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-semibold text-white",
                  count ? "opacity-100" : "opacity-0"
                )}
              >
                {count}
              </span>
            </Button>

            {!user ? (
              <Button onClick={() => navigate("/auth")}>Sign in</Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-background/40">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name.split(" ")[0]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  {user.role === "Vendor" && (
                    <DropdownMenuItem onClick={() => navigate("/dashboard/vendor/products")}>
                      <Store className="mr-2 h-4 w-4" />
                      Vendor center
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        await api.post("/auth/logout");
                      } finally {
                        clear();
                        navigate("/");
                      }
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="md:hidden pb-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!search.trim()) return;
              navigate(`/products?q=${encodeURIComponent(search.trim())}`);
            }}
            className="relative"
          >
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="h-11 pl-10"
            />
          </form>
        </div>
      </div>
    </div>
  );
}

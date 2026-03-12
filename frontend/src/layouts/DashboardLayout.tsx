import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, BarChart3, Shield, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { RealtimeNotices } from "@/components/RealtimeNotices";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground",
    isActive && "bg-secondary text-foreground"
  );

export function DashboardLayout() {
  const { user, clear } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <RealtimeNotices />
      <div className="container py-8">
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-xl border border-border bg-card/60 p-4 shadow-soft backdrop-blur">
            <div className="mb-4">
              <div className="text-sm font-semibold">Dashboard</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
            <nav className="space-y-1">
              <NavLink to="/dashboard" end className={linkClass}>
                <LayoutDashboard className="h-4 w-4" />
                Overview
              </NavLink>
              {user?.role === "Customer" && (
                <NavLink to="/dashboard/orders" className={linkClass}>
                  <ShoppingBag className="h-4 w-4" />
                  Orders
                </NavLink>
              )}
              {user?.role === "Vendor" && (
                <>
                  <NavLink to="/dashboard/vendor/products" className={linkClass}>
                    <Package className="h-4 w-4" />
                    Products
                  </NavLink>
                  <NavLink to="/dashboard/vendor/orders" className={linkClass}>
                    <ShoppingBag className="h-4 w-4" />
                    Orders
                  </NavLink>
                  <NavLink to="/dashboard/vendor/analytics" className={linkClass}>
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </NavLink>
                </>
              )}
              {user?.role === "Admin" && (
                <>
                  <NavLink to="/dashboard/admin" className={linkClass}>
                    <Shield className="h-4 w-4" />
                    Admin overview
                  </NavLink>
                  <NavLink to="/dashboard/admin/vendors" className={linkClass}>
                    <Users className="h-4 w-4" />
                    Vendor approvals
                  </NavLink>
                </>
              )}
            </nav>
            <div className="mt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    await api.post("/auth/logout");
                  } finally {
                    clear();
                    navigate("/");
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </Button>
            </div>
          </aside>

          <section className="rounded-xl border border-border bg-card/60 p-5 shadow-soft backdrop-blur">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}

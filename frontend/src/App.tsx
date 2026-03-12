import { Route, Routes, Navigate } from "react-router-dom";
import { MainLayout } from "@/layouts/MainLayout";
import { HomePage } from "@/pages/HomePage";
import { ProductsPage } from "@/pages/ProductsPage";
import { ProductPage } from "@/pages/ProductPage";
import { VendorStorefrontPage } from "@/pages/VendorStorefrontPage";
import { CartPage } from "@/pages/CartPage";
import { WishlistPage } from "@/pages/WishlistPage";
import { AuthPage } from "@/pages/AuthPage";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { CustomerOrdersPage } from "@/pages/dashboard/CustomerOrdersPage";
import { CustomerOrderDetailPage } from "@/pages/dashboard/CustomerOrderDetailPage";
import { VendorProductsPage } from "@/pages/dashboard/VendorProductsPage";
import { VendorOrdersPage } from "@/pages/dashboard/VendorOrdersPage";
import { VendorAnalyticsPage } from "@/pages/dashboard/VendorAnalyticsPage";
import { AdminOverviewPage } from "@/pages/dashboard/AdminOverviewPage";
import { AdminVendorsPage } from "@/pages/dashboard/AdminVendorsPage";
import { useAuthStore } from "@/store/auth";
import { AppBootstrap } from "@/components/AppBootstrap";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function RequireRole({ role, children }: { role: string[]; children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth" replace />;
  if (!role.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function DashboardIndex() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth" replace />;
  if (user.role === "Admin") return <Navigate to="admin" replace />;
  if (user.role === "Vendor") return <Navigate to="vendor/products" replace />;
  return <Navigate to="orders" replace />;
}

export default function App() {
  return (
    <>
      <AppBootstrap />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/p/:slug" element={<ProductPage />} />
          <Route path="/store/:slug" element={<VendorStorefrontPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardIndex />} />
          <Route
            path="orders"
            element={
              <RequireRole role={["Customer"]}>
                <CustomerOrdersPage />
              </RequireRole>
            }
          />
          <Route
            path="orders/:id"
            element={
              <RequireRole role={["Customer"]}>
                <CustomerOrderDetailPage />
              </RequireRole>
            }
          />
          <Route
            path="vendor/products"
            element={
              <RequireRole role={["Vendor"]}>
                <VendorProductsPage />
              </RequireRole>
            }
          />
          <Route
            path="vendor/orders"
            element={
              <RequireRole role={["Vendor"]}>
                <VendorOrdersPage />
              </RequireRole>
            }
          />
          <Route
            path="vendor/analytics"
            element={
              <RequireRole role={["Vendor"]}>
                <VendorAnalyticsPage />
              </RequireRole>
            }
          />
          <Route
            path="admin"
            element={
              <RequireRole role={["Admin"]}>
                <AdminOverviewPage />
              </RequireRole>
            }
          />
          <Route
            path="admin/vendors"
            element={
              <RequireRole role={["Admin"]}>
                <AdminVendorsPage />
              </RequireRole>
            }
          />
        </Route>
      </Routes>
    </>
  );
}

import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/60 backdrop-blur">
      <div className="container py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-2">
            <div className="text-sm font-semibold">NexChakra</div>
            <div className="text-sm text-muted-foreground">Electronics, Drone & AC parts marketplace with real-time inventory.</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold">Shop</div>
            <div className="text-sm text-muted-foreground">
              <Link to="/products">All products</Link>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold">Account</div>
            <div className="text-sm text-muted-foreground">
              <Link to="/dashboard">Dashboard</Link>
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold">Vendor</div>
            <div className="text-sm text-muted-foreground">
              <Link to="/auth">Become a vendor</Link>
            </div>
          </div>
        </div>
        <Separator className="my-8" />
        <div className="text-xs text-muted-foreground">© {new Date().getFullYear()} NexChakra. All rights reserved.</div>
      </div>
    </footer>
  );
}

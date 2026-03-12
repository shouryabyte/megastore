import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CustomerOrdersPage() {
  const q = useQuery({
    queryKey: ["orders"],
    queryFn: async () => (await api.get("/orders")).data.items
  });

  return (
    <div>
      <div className="mb-4">
        <div className="text-xl font-bold tracking-tight">Orders</div>
        <div className="text-sm text-muted-foreground">Track orders, download invoices, and verify payment status.</div>
      </div>
      <div className="space-y-3">
        {(q.data ?? []).map((o: any) => (
          <Link key={o.id} to={`/dashboard/orders/${o.id}`} className="block">
            <Card className="transition hover:shadow-soft">
              <CardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold">{o.orderNumber}</div>
                  <div className="text-sm text-muted-foreground">Total ₹{o.total.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{o.status}</Badge>
                  <Badge variant={o.paymentStatus === "paid" ? "primary" : "default"}>{o.paymentStatus}</Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {!q.isLoading && !(q.data ?? []).length && <div className="text-sm text-muted-foreground">No orders yet.</div>}
      </div>
    </div>
  );
}


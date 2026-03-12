import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function CustomerOrderDetailPage() {
  const { id } = useParams();
  const q = useQuery({
    queryKey: ["order", id],
    queryFn: async () => (await api.get(`/orders/${id}`)).data.order,
    enabled: !!id
  });

  const o = q.data;
  if (q.isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (!o) return <div className="text-sm text-muted-foreground">Not found</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xl font-bold tracking-tight">{o.orderNumber}</div>
          <div className="text-sm text-muted-foreground">Placed {new Date(o.placedAt).toLocaleString()}</div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{o.status}</Badge>
          <Badge variant={o.paymentStatus === "paid" ? "primary" : "default"}>{o.paymentStatus}</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-3">
          <div className="text-sm font-semibold">Items</div>
          <div className="space-y-2">
            {o.items.map((it: any) => (
              <div key={it.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div className="min-w-0">
                  <div className="line-clamp-1 text-sm font-semibold">{it.titleSnapshot}</div>
                  <div className="text-xs text-muted-foreground">
                    SKU {it.skuSnapshot} • Qty {it.quantity}
                  </div>
                </div>
                <div className="text-sm font-semibold">₹{it.totalPrice.toFixed(2)}</div>
              </div>
            ))}
          </div>
          <Separator />
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <div className="text-muted-foreground">Subtotal</div>
            <div className="text-right font-medium">₹{o.itemsSubtotal.toFixed(2)}</div>
            <div className="text-muted-foreground">Shipping</div>
            <div className="text-right font-medium">₹{o.shippingFee.toFixed(2)}</div>
            <div className="text-muted-foreground">Tax</div>
            <div className="text-right font-medium">₹{o.tax.toFixed(2)}</div>
            <div className="text-muted-foreground font-semibold">Total</div>
            <div className="text-right text-base font-extrabold">₹{o.total.toFixed(2)}</div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              variant="outline"
              onClick={async () => {
                const res = await api.get(`/orders/${o.id}/invoice`, { responseType: "blob" });
                const url = URL.createObjectURL(res.data);
                const a = document.createElement("a");
                a.href = url;
                a.download = `invoice-${o.orderNumber}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
            >
              Download invoice (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


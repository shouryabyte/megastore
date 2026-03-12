import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export function VendorOrdersPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["vendor-orders"],
    queryFn: async () => (await api.get("/orders/vendor/list")).data.items,
    retry: false
  });

  const approvalError = (q.error as any)?.response?.data?.error?.code === "VENDOR_NOT_APPROVED";
  const [active, setActive] = useState<string | null>(null);

  const detail = useQuery({
    queryKey: ["vendor-order", active],
    queryFn: async () => (await api.get(`/orders/vendor/${active}`)).data.order,
    enabled: !!active,
    retry: false
  });

  const updateItem = useMutation({
    mutationFn: async (input: { orderId: string; itemId: string; status: string }) =>
      api.patch(`/orders/vendor/${input.orderId}/items/${input.itemId}/status`, { status: input.status }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["vendor-orders"] });
      if (active) await qc.invalidateQueries({ queryKey: ["vendor-order", active] });
    }
  });

  if (approvalError) {
    return (
      <Card>
        <CardContent>
          <div className="text-sm font-semibold">Approval pending</div>
          <div className="mt-1 text-sm text-muted-foreground">Your vendor account is not approved yet.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="text-xl font-bold tracking-tight">Vendor orders</div>
        <div className="text-sm text-muted-foreground">Orders assigned to your inventory.</div>
      </div>
      <div className="space-y-3">
        {(q.data ?? []).map((o: any) => (
          <Card key={o.id}>
            <CardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-sm font-semibold">{o.orderNumber}</div>
                <div className="text-sm text-muted-foreground">Total ₹{Number(o.vendorTotal ?? 0).toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{o.status}</Badge>
                <Badge variant={o.paymentStatus === "paid" ? "primary" : "default"}>{o.paymentStatus}</Badge>
                <Dialog open={active === o.id} onOpenChange={(open) => setActive(open ? o.id : null)}>
                  <DialogTrigger asChild>
                    <Button variant="outline">Manage</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Manage order</DialogTitle>
                      <DialogDescription>Update item fulfilment statuses for your products.</DialogDescription>
                    </DialogHeader>
                    {detail.isLoading ? (
                      <div className="text-sm text-muted-foreground">Loading…</div>
                    ) : detail.data ? (
                      <div className="space-y-3">
                        <div className="rounded-xl border border-border bg-card/30 p-3">
                          <div className="text-sm font-semibold">{detail.data.orderNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {detail.data.shippingAddress?.city ?? ""}
                            <span className="opacity-80"> {"\u2022"} Total ₹{Number(detail.data.vendorTotal ?? 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          {detail.data.items.map((it: any) => (
                            <div key={it.id} className="rounded-xl border border-border bg-card/30 p-3">
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="line-clamp-1 text-sm font-semibold">{it.titleSnapshot}</div>
                                  <div className="text-xs text-muted-foreground">
                                    SKU {it.skuSnapshot} • Qty {it.quantity}
                                  </div>
                                </div>
                                <Badge variant="outline">{it.status}</Badge>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {["packed", "shipped", "delivered", "cancelled"].map((s) => (
                                  <Button
                                    key={s}
                                    size="sm"
                                    variant={s === "cancelled" ? "destructive" : "secondary"}
                                    disabled={updateItem.isPending}
                                    onClick={() => updateItem.mutate({ orderId: detail.data.id, itemId: it.id, status: s })}
                                  >
                                    Mark {s}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">Unable to load order.</div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
        {!q.isLoading && !(q.data ?? []).length && <div className="text-sm text-muted-foreground">No orders yet.</div>}
      </div>
    </div>
  );
}

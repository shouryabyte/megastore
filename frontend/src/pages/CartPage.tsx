import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart, useCartMutations } from "@/hooks/useCart";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Money } from "@/components/Money";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { api } from "@/services/api";
import { loadRazorpay } from "@/utils/razorpay";
import { useAuthStore } from "@/store/auth";

export function CartPage() {
  const nav = useNavigate();
  const { user } = useAuthStore();
  const cartQ = useCart();
  const cartMut = useCartMutations();
  const [open, setOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const cart = cartQ.data;
  const items = cart?.items ?? [];

  const subtotal = useMemo(() => items.reduce((s: number, it: any) => s + (it.priceSnapshot ?? 0) * (it.quantity ?? 0), 0), [items]);
  const shipping = subtotal > 999 ? 0 : items.length ? 49 : 0;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  const [addr, setAddr] = useState({
    fullName: user?.name ?? "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    country: "India",
    pincode: ""
  });

  if (!user) {
    return (
      <div className="container py-10">
        <Card>
          <CardContent>
            <div className="text-sm font-semibold">Sign in required</div>
            <div className="mt-1 text-sm text-muted-foreground">Please sign in to view your cart.</div>
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
      <div className="mb-4">
        <div className="text-2xl font-bold tracking-tight">Cart</div>
        <div className="text-sm text-muted-foreground">Real-time updates are enabled for your cart.</div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <div className="text-sm font-semibold">Items</div>
          </CardHeader>
          <CardContent className="space-y-4">
            {!items.length ? (
              <div className="text-sm text-muted-foreground">Your cart is empty.</div>
            ) : (
              items.map((it: any) => (
                <div key={it.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="line-clamp-1 text-sm font-semibold">{it.product?.title ?? "Product"}</div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <Money value={it.priceSnapshot} /> • Qty {it.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      className="w-24"
                      type="number"
                      min={1}
                      max={50}
                      value={it.quantity}
                      onChange={(e) => cartMut.update.mutate({ itemId: it.id, quantity: Math.max(1, Math.min(50, Number(e.target.value || 1))) })}
                    />
                    <Button variant="outline" onClick={() => cartMut.remove.mutate(it.id)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}

            {!!items.length && (
              <Button variant="outline" onClick={() => cartMut.clear.mutate()}>
                Clear cart
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader>
            <div className="text-sm font-semibold">Summary</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Subtotal" value={<Money value={subtotal} />} />
            <Row label="Shipping" value={<Money value={shipping} />} />
            <Row label="Tax (18%)" value={<Money value={tax} />} />
            <Separator />
            <Row label={<span className="font-semibold">Total</span>} value={<span className="text-lg font-extrabold">₹{total.toFixed(2)}</span>} />

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" disabled={!items.length}>
                  Checkout
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delivery address</DialogTitle>
                  <DialogDescription>Place the order, then complete payment with Razorpay.</DialogDescription>
                </DialogHeader>
                {checkoutError && <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{checkoutError}</div>}
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input placeholder="Full name" value={addr.fullName} onChange={(e) => setAddr((a) => ({ ...a, fullName: e.target.value }))} />
                  <Input placeholder="Phone" value={addr.phone} onChange={(e) => setAddr((a) => ({ ...a, phone: e.target.value }))} />
                  <div className="sm:col-span-2">
                    <Input placeholder="Address line 1" value={addr.line1} onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-2">
                    <Input placeholder="Address line 2 (optional)" value={addr.line2} onChange={(e) => setAddr((a) => ({ ...a, line2: e.target.value }))} />
                  </div>
                  <Input placeholder="City" value={addr.city} onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))} />
                  <Input placeholder="State" value={addr.state} onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))} />
                  <Input placeholder="Country" value={addr.country} onChange={(e) => setAddr((a) => ({ ...a, country: e.target.value }))} />
                  <Input placeholder="Pincode" value={addr.pincode} onChange={(e) => setAddr((a) => ({ ...a, pincode: e.target.value }))} />
                </div>
                <Button
                  className="mt-3 w-full"
                  disabled={paying}
                  onClick={async () => {
                    setCheckoutError(null);
                    if (!addr.fullName.trim() || !addr.phone.trim() || !addr.line1.trim() || !addr.city.trim() || !addr.state.trim() || !addr.country.trim() || !addr.pincode.trim()) {
                      setCheckoutError("Please fill all required address fields.");
                      return;
                    }
                    if (items.length === 0) {
                      setCheckoutError("Your cart is empty.");
                      return;
                    }

                    setPaying(true);
                    try {
                      const shippingAddress = { ...addr, ...(addr.line2?.trim() ? { line2: addr.line2 } : {}) };
                      const create = await api.post("/orders", { shippingAddress });
                      const order = create.data.order;
                      const rp = await api.post("/payments/razorpay/order", { orderId: order.id });

                      await loadRazorpay();
                      const key = (rp.data.keyId as string) || (import.meta.env.VITE_RAZORPAY_KEY as string);
                      if (!key) throw new Error("Missing Razorpay key. Set VITE_RAZORPAY_KEY (or backend RAZORPAY_KEY_ID).");

                      const rzp = new window.Razorpay({
                        key,
                        amount: Math.round(rp.data.amount * 100),
                        currency: rp.data.currency,
                        name: "NexChakra",
                        description: `Order ${order.orderNumber}`,
                        order_id: rp.data.razorpayOrderId,
                        handler: async (resp: any) => {
                          await api.post("/payments/razorpay/verify", {
                            orderId: order.id,
                            razorpayOrderId: resp.razorpay_order_id,
                            razorpayPaymentId: resp.razorpay_payment_id,
                            razorpaySignature: resp.razorpay_signature
                          });
                          setOpen(false);
                          nav(`/dashboard/orders/${order.id}`);
                        },
                        modal: {
                          ondismiss: () => setCheckoutError("Payment cancelled.")
                        },
                        prefill: { name: user.name, email: user.email, contact: addr.phone }
                      });

                      rzp.on("payment.failed", (resp: any) => {
                        const msg = resp?.error?.description || resp?.error?.reason || "Payment failed.";
                        setCheckoutError(msg);
                      });

                      rzp.open();
                    } catch (e: any) {
                      setCheckoutError(e?.response?.data?.error?.message ?? e?.message ?? "Payment flow failed.");
                    } finally {
                      setPaying(false);
                    }
                  }}
                >
                  {paying ? "Processing…" : "Place order & pay"}
                </Button>
              </DialogContent>
            </Dialog>
            <div className="text-xs text-muted-foreground">Payments handled securely by Razorpay. Stock updates happen in real time.</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

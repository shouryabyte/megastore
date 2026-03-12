import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSocket, disconnectSocket, getSocket } from "@/services/socket";
import { useAuthStore } from "@/store/auth";
import { useRealtimeStore } from "@/store/realtime";

export function useSocketEvents() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken);
  const push = useRealtimeStore((s) => s.push);

  useEffect(() => {
    const s = getSocket();
    if (token) connectSocket();
    else disconnectSocket();

    const onCart = (cart: any) => qc.setQueryData(["cart"], cart);
    const onStock = (payload: any) => {
      qc.setQueryData(["product", payload.productId], (prev: any) => {
        if (!prev) return prev;
        return { ...prev, inventory: prev.inventory ? { ...prev.inventory, quantity: payload.quantity } : { quantity: payload.quantity, lowStockThreshold: 0, sku: "" } };
      });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
    };
    const onVendorNewOrder = (payload: any) => {
      qc.invalidateQueries({ queryKey: ["vendor-orders"] });
      push({ kind: "success", title: "New order received", message: payload?.orderNumber ? `Order ${payload.orderNumber} received.` : "You have a new order." });
    };
    const onLowStock = (payload: any) => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      push({ kind: "warning", title: "Low stock alert", message: payload?.quantity !== undefined ? `Only ${payload.quantity} left in stock.` : "A product is low on stock." });
    };

    s.on("cart:updated", onCart);
    s.on("inventory:stockUpdated", onStock);
    s.on("vendor:newOrder", onVendorNewOrder);
    s.on("inventory:lowStock", onLowStock);
    return () => {
      s.off("cart:updated", onCart);
      s.off("inventory:stockUpdated", onStock);
      s.off("vendor:newOrder", onVendorNewOrder);
      s.off("inventory:lowStock", onLowStock);
    };
  }, [qc, token, push]);
}

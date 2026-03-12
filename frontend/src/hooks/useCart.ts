import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

export function useCart() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["cart"],
    queryFn: async () => (await api.get("/cart")).data.cart,
    enabled: user?.role === "Customer",
    staleTime: 15_000
  });
}

export function useCartMutations() {
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: async (input: { productId: string; quantity: number }) => (await api.post("/cart/items", input)).data.cart,
    onSuccess: (cart) => qc.setQueryData(["cart"], cart)
  });
  const update = useMutation({
    mutationFn: async (input: { itemId: string; quantity: number }) => (await api.patch("/cart/items", input)).data.cart,
    onSuccess: (cart) => qc.setQueryData(["cart"], cart)
  });
  const remove = useMutation({
    mutationFn: async (itemId: string) => (await api.delete(`/cart/items/${itemId}`)).data.cart,
    onSuccess: (cart) => qc.setQueryData(["cart"], cart)
  });
  const clear = useMutation({
    mutationFn: async () => (await api.delete("/cart")).data.cart,
    onSuccess: (cart) => qc.setQueryData(["cart"], cart)
  });
  return { add, update, remove, clear };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

export function useWishlist() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => (await api.get("/wishlist")).data.wishlist,
    enabled: user?.role === "Customer",
    staleTime: 30_000
  });
}

export function useWishlistMutations() {
  const qc = useQueryClient();
  const add = useMutation({
    mutationFn: async (productId: string) => (await api.post(`/wishlist/${productId}`)).data.wishlist,
    onSuccess: (wl) => qc.setQueryData(["wishlist"], wl)
  });
  const remove = useMutation({
    mutationFn: async (productId: string) => (await api.delete(`/wishlist/${productId}`)).data.wishlist,
    onSuccess: (wl) => qc.setQueryData(["wishlist"], wl)
  });
  return { add, remove };
}

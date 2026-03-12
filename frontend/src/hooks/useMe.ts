import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";

export function useMe() {
  const { accessToken, setSession, clear } = useAuthStore();
  const q = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data.user as any;
    },
    enabled: !!accessToken,
    staleTime: 60_000,
    retry: 0
  });

  useEffect(() => {
    if (q.data) {
      const token = useAuthStore.getState().accessToken;
      if (token) setSession(q.data, token);
    }
    if (q.isError) clear();
  }, [q.data, q.isError, setSession, clear]);

  return q;
}

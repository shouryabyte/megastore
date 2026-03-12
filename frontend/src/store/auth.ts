import { create } from "zustand";

export type Role = "Admin" | "Vendor" | "Customer";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  vendorId?: string;
};

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  setSession: (user: AuthUser, accessToken: string) => void;
  clear: () => void;
};

const LS_KEY = "nexchakra_session_v1";

export const useAuthStore = create<AuthState>((set) => {
  const raw = localStorage.getItem(LS_KEY);
  const initial = raw ? (JSON.parse(raw) as { user: AuthUser; accessToken: string }) : null;
  return {
    user: initial?.user ?? null,
    accessToken: initial?.accessToken ?? null,
    setSession: (user: AuthUser, accessToken: string) =>
      set(() => {
        localStorage.setItem(LS_KEY, JSON.stringify({ user, accessToken }));
        return { user, accessToken };
      }),
    clear: () =>
      set(() => {
        localStorage.removeItem(LS_KEY);
        return { user: null, accessToken: null };
      })
  };
});

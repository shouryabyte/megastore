import { create } from "zustand";

export type RealtimeNotice = {
  id: string;
  kind: "info" | "success" | "warning";
  title: string;
  message?: string;
  createdAt: number;
};

type State = {
  notices: RealtimeNotice[];
  push: (n: Omit<RealtimeNotice, "id" | "createdAt"> & { id?: string }) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useRealtimeStore = create<State>((set) => ({
  notices: [],
  push: (n) =>
    set((s) => {
      const id = n.id ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const next: RealtimeNotice = { id, kind: n.kind, title: n.title, message: n.message, createdAt: Date.now() };
      return { notices: [next, ...s.notices].slice(0, 5) };
    }),
  remove: (id) => set((s) => ({ notices: s.notices.filter((x) => x.id !== id) })),
  clear: () => set({ notices: [] })
}));


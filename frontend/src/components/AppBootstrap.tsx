import { useMe } from "@/hooks/useMe";
import { useSocketEvents } from "@/hooks/useSocketEvents";

export function AppBootstrap() {
  useMe();
  useSocketEvents();
  return null;
}


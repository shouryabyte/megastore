import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/store/auth";

let socket: Socket | null = null;

export function getSocket() {
  if (socket) return socket;
  const url = import.meta.env.VITE_SOCKET_URL as string;
  socket = io(url, {
    transports: ["websocket"],
    autoConnect: false
  });
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  const token = useAuthStore.getState().accessToken;
  s.auth = token ? { token } : {};
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
}


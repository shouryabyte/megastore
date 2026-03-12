import type { Server as IOServer } from "socket.io";
import { verifyAccessToken } from "../utils/jwt.js";
import { roomUser, roomVendor } from "./socketHub.js";

export function initSockets(io: IOServer) {
  io.on("connection", (socket) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ||
      (socket.handshake.headers.authorization?.toString().startsWith("Bearer ")
        ? socket.handshake.headers.authorization.toString().slice("Bearer ".length).trim()
        : undefined) ||
      (socket.handshake.query?.token as string | undefined);

    if (token) {
      try {
        const payload = verifyAccessToken(token);
        socket.join(roomUser(payload.sub));
        if (payload.vendorId) socket.join(roomVendor(payload.vendorId));
        socket.data.auth = payload;
      } catch {
        // ignore invalid token; keep connection for public realtime like stock
      }
    }

    socket.on("ping", () => socket.emit("pong"));
  });
}


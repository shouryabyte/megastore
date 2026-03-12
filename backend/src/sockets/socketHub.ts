import type { Server as IOServer } from "socket.io";

let io: IOServer | null = null;

export function setIo(server: IOServer) {
  io = server;
}

export function getIo() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function roomUser(userId: string) {
  return `user:${userId}`;
}

export function roomVendor(vendorId: string) {
  return `vendor:${vendorId}`;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  if (!io) return;
  io.to(roomUser(userId)).emit(event, payload);
}

export function emitToVendor(vendorId: string, event: string, payload: unknown) {
  if (!io) return;
  io.to(roomVendor(vendorId)).emit(event, payload);
}

export function emitGlobal(event: string, payload: unknown) {
  if (!io) return;
  io.emit(event, payload);
}


import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@execution-engine/shared";

const SYNC_SERVER_URL = process.env.SYNC_SERVER_URL || "http://localhost:3000";

export const syncClientSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SYNC_SERVER_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
});

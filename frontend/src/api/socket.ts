import { io, Socket } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@execution-engine/shared";
import { ENV } from "../config/env";

export const collabSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io(ENV.COLLAB_SOCKET_URL, {
  autoConnect: true,
});

export const executionSocket = io(ENV.EXECUTION_API_URL, {
  autoConnect: true,
});

// Backwards compatibility aliases
export const socket2 = collabSocket;
export const socket = executionSocket;
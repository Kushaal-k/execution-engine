import { io } from "socket.io-client";
import type { ServerToClientEvents, ClientToServerEvents } from "@execution-engine/shared";
import type { Socket } from "socket.io-client";

const socket2: Socket<ServerToClientEvents, ClientToServerEvents> = io("http://localhost:3000");
const socket = io("http://localhost:5000");

export {socket, socket2};
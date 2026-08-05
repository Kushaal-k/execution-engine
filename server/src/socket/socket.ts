import type { Server } from 'socket.io';
import { RoomManager } from '../room/room-manager.js';
import type { ClientToServerEvents, ServerToClientEvents } from "../types/types.js";
import { registerLifecycleHandlers } from './lifecycleHandlers.js';
import { registerPresenceHandlers } from './presenceHandlers.js';
import { registerWorkspaceHandlers } from './workspaceHandlers.js';

const roomManager = new RoomManager();

export function registerSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    io.on("connection", (socket) => {
        // Room Lifecycle & Session Handlers (join-room, disconnect)
        registerLifecycleHandlers(socket, roomManager);

        // Real-Time Document & Cursor Sync (yjs update, presence-update)
        registerPresenceHandlers(socket, roomManager);

        // Workspace Structural Mutations (create/rename/delete files & folders)
        registerWorkspaceHandlers(socket, io, roomManager);
    });
}

import type { Socket } from 'socket.io';
import type { RoomManager } from '../room/room-manager.js';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/types.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerPresenceHandlers(socket: TypedSocket, roomManager: RoomManager) {
    // Real-time Yjs CRDT document text updates
    socket.on('update', (update) => {
        const roomId = socket.data.roomId;
        if (!roomId) return;

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        const workspace = room.getWorkspace();
        workspace.applyUpdate(update);

        socket.to(roomId).emit("update", update);
    });

    // Real-time remote cursor & selection presence
    socket.on('presence-update', (presence) => {
        const roomId = socket.data.roomId;
        if (!roomId) return;

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        const user = room.getUser(socket.id);
        if (!user) return;

        socket.to(roomId).emit('presence-update', {
            userId: socket.id,
            presence,
            user
        });
    });
}

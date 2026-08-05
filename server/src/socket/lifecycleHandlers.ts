import type { Socket } from 'socket.io';
import type { RoomManager } from '../room/room-manager.js';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/types.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerLifecycleHandlers(socket: TypedSocket, roomManager: RoomManager) {
    socket.on('join-room', (roomId: string, username: string) => {
        socket.data.roomId = roomId;

        const room = roomManager.getRoom(roomId)
            ?? roomManager.createRoom(roomId);

        room.join(socket.id, username);
        socket.join(roomId);

        const workspace = room.getWorkspace();
        socket.emit("sync", workspace.getSnapshot());
    });

    socket.on('disconnect', () => {
        const roomId = socket.data.roomId;
        if (!roomId) return;

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        const color = room.getUser(socket.id)?.color;
        if (!color) return;

        room.leave(socket.id, color);
        socket.to(roomId).emit('user-left', socket.id);

        if (room.isEmpty()) {
            roomManager.deleteRoom(roomId);
        }
    });
}

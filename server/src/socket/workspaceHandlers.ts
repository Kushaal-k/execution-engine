import type { Server, Socket } from 'socket.io';
import type { RoomManager } from '../room/room-manager.js';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/types.js';
import type { Workspace } from '../room/workspace.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function registerWorkspaceHandlers(socket: TypedSocket, io: TypedServer, roomManager: RoomManager) {
    const withWorkspace = (action: (workspace: Workspace) => void) => {
        const roomId = socket.data.roomId;
        if (!roomId) return;

        const room = roomManager.getRoom(roomId);
        if (!room) return;

        const workspace = room.getWorkspace();
        action(workspace);

        io.to(roomId).emit("sync", workspace.getSnapshot());
    };

    // File Mutations
    socket.on('create-file', (fileName: string, language: string, parentFolderId: string | null) => {
        withWorkspace(ws => ws.createFile(fileName, language, parentFolderId));
    });

    socket.on('delete-file', (fileId: string) => {
        withWorkspace(ws => ws.deleteFile(fileId));
    });

    socket.on('rename-file', (fileId: string, newFileName: string) => {
        withWorkspace(ws => ws.renameFile(fileId, newFileName));
    });

    // Folder Mutations
    socket.on('create-folder', (folderName: string, parentFolderId: string | null) => {
        withWorkspace(ws => ws.createFolder(folderName, parentFolderId));
    });

    socket.on('delete-folder', (folderId: string) => {
        withWorkspace(ws => ws.deleteFolder(folderId));
    });
}

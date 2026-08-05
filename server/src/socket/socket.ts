import type { Server } from 'socket.io';
import { RoomManager } from '../room/room-manager.js';
import type { ClientToServerEvents, ServerToClientEvents, User } from "../types/types.js";

const roomManager = new RoomManager();

export function registerSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    io.on("connection", (socket) => {

        socket.on('join-room', (roomId, username) => {
            socket.data.roomId = roomId;
            
            const room = roomManager.getRoom(roomId) 
                        ?? roomManager.createRoom(roomId);
            
            room.join(socket.id, username);
            socket.join(roomId);
            
            const workspace = room.getWorkspace();

            socket.emit("sync", workspace.getSnapshot());
        })    

        socket.on('update', (update) => {
            const roomId = socket.data.roomId;

            let room = roomManager.getRoom(roomId);

            if(!room){
                return;
            }

            const workspace = room.getWorkspace();
            workspace.applyUpdate(update);

            socket.to(roomId).emit("update", update);            
        })

        socket.on('presence-update', (presence) => {
            const roomId = socket.data.roomId;
            const room = roomManager.getRoom(roomId);
            
            if(!room) return;

            const user = room?.getUser(socket.id);

            if(!user) return;
            
            socket.to(roomId).emit('presence-update', {
                userId: socket.id,
                presence,
                user
            })
        })

        socket.on('create-file', (fileName: string, language: string, parentFolderId: string | null) => {
            const roomId = socket.data.roomId;

            let room = roomManager.getRoom(roomId);

            if(!room){
                return;
            }

            const workspace = room.getWorkspace();

            workspace.createFile(fileName, language, parentFolderId);

            io.to(roomId).emit("sync", workspace.getSnapshot());
        })

        socket.on('delete-file', (fileId: string) => {
            const roomId = socket.data.roomId;

            let room = roomManager.getRoom(roomId);

            if(!room){
                return;
            }

            const workspace = room.getWorkspace();

            workspace.deleteFile(fileId);

            io.to(roomId).emit("sync", workspace.getSnapshot());
        })

        socket.on('rename-file', (fileId: string, newFileName: string) => {
            const roomId = socket.data.roomId;

            let room = roomManager.getRoom(roomId);

            if(!room){
                return;
            }

            const workspace = room.getWorkspace();

            workspace.renameFile(fileId, newFileName);

            io.to(roomId).emit("sync", workspace.getSnapshot());
        })

        socket.on('create-folder', (folderName: string, parentFolderId: string | null) => {
            const roomId = socket.data.roomId;

            let room = roomManager.getRoom(roomId);

            if(!room){
                return;
            }

            const workspace = room.getWorkspace();

            workspace.createFolder(folderName, parentFolderId);

            io.to(roomId).emit("sync", workspace.getSnapshot());
        })

        socket.on('delete-folder', (folderId) => {
            const roomId = socket.data.roomId;

            let room = roomManager.getRoom(roomId);

            if(!room){
                return;
            }

            const workspace = room.getWorkspace();

            workspace.deleteFolder(folderId);

            io.to(roomId).emit("sync", workspace.getSnapshot());
        })
        
        socket.on('disconnect', () => {
            const roomId = socket.data.roomId;

            if(!roomId){
                return;
            }
            const room = roomManager.getRoom(roomId);

            if(!room) return;

            const color = room.getUser(socket.id)?.color;
            if(!color) return;

            room.leave(socket.id, color);

            socket.to(roomId).emit('user-left', socket.id);

            if(room.isEmpty()){
                roomManager.deleteRoom(roomId);
            }
        })
    })
}

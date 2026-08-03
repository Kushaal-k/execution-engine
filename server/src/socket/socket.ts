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

            const state = room.getState();
            socket.emit("sync", state);
        })    

        socket.on('update', (update) => {
            const roomId = socket.data.roomId;

            let room = roomManager.getRoom(roomId);

            if(!room){
                return;
            }

            room.applyUpdate(update);
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

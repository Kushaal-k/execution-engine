import type { Server } from 'socket.io';
import { RoomManager } from '../room/room-manager.js';
import type { ClientToServerEvents,ServerToClientEvents } from "../types/types.js";

const roomManager = new RoomManager();

export function registerSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    io.on("connection", (socket) => {
        console.log("Client connected: ", socket.id);

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
            console.log(room.getText());
        })

        socket.on('disconnect', () => {
            const roomId = socket.data.roomId;

            if(!roomId){
                return;
            }

            const room = roomManager.getRoom(roomId);

            if(!room) return;

            room.leave(socket.id);

            if(room.isEmpty()){
                roomManager.deleteRoom(roomId);
            }
        
            console.log("Client disconnected!")

        })
    })
}

import { Room } from "./room.js";

export class RoomManager {
    private roomMap = new Map<string, Room>();

    public getRoom(roomId: string) {
        return this.roomMap.get(roomId);
    }

    public createRoom(roomId: string) {
        const room = new Room(roomId);
        this.roomMap.set(roomId, room);

        return room;
    }

    public deleteRoom(roomId: string) {
        this.roomMap.delete(roomId);
    }
}
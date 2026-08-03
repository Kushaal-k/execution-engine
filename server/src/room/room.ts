import * as Y from "yjs";
import type { User } from "../types/types.js";

const COLORS = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#F9C74F",
    "#F8961E",
    "#9B5DE5",
    "#577590",
];

export class Room {

    private doc = new Y.Doc();
    private users = new Map<string, User>();
    private availableColors = [...COLORS];

    constructor() {
        this.availableColors.sort(() => Math.random() - 0.5);
    }

    private assignColor(): string {
        if(this.availableColors.length == 0){
            return "#808080";
        }

        return this.availableColors.shift()!;
    }

    private releaseColor(color: string) {
        this.availableColors.push(color);
    }

    join(socketId: string, username: string) {
        const user: User = {
            username,
            color: this.assignColor()
        }
        this.users.set(socketId, user);
    }
    
    leave(socketId: string, color: string) {
        this.users.delete(socketId);
        if (color !== "#808080") {
            this.releaseColor(color);
        }
    }

    applyUpdate(update: Uint8Array){
        Y.applyUpdate(this.doc, update);
    }

    getState(): Uint8Array {
        return Y.encodeStateAsUpdate(this.doc);
    }

    getUser(socketId: string) {
        return this.users.get(socketId);
    }

    isEmpty(): boolean {
        return this.users.size === 0;
    }

    getText(): string {
        return this.doc.getText('main').toString();
    }
}

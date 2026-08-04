import * as Y from "yjs";
import type { User } from "../types/types.js";
import { Workspace } from "./workspace.js";

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

    private workspace: Workspace;
    private users = new Map<string, User>();
    private availableColors = [...COLORS];

    constructor(name: string) {
        this.availableColors.sort(() => Math.random() - 0.5);
        this.workspace = new Workspace(name);
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

    getUser(socketId: string) {
        return this.users.get(socketId);
    }

    isEmpty(): boolean {
        return this.users.size === 0;
    }

    getWorkspace(): Workspace {
        return this.workspace;
    }
 }

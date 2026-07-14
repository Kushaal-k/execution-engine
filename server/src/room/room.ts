import * as Y from "yjs";

interface User {
    username: string,
}

export class Room {

    private doc = new Y.Doc();
    private users = new Map<string, User>();
    
    join(socketId: string, username: string) {
        const user: User = {
            username
        }

        this.users.set(socketId, user);
    }
    
    leave(socketId: string) {
        this.users.delete(socketId);
    }

    applyUpdate(update: Uint8Array){
        Y.applyUpdate(this.doc, update);
    }

    getState(): Uint8Array {
        return Y.encodeStateAsUpdate(this.doc);
    }

    isEmpty(): boolean {
        return this.users.size === 0;
    }

    getText(): string {
        return this.doc.getText('main').toString();
    }
}

export interface ClientToServerEvents {
    "join-room": (roomId: string, username: string) => void;
    "update": (update: Uint8Array) => void;
}

export interface ServerToClientEvents {
    "sync": (state: Uint8Array) => void;
    "update": (update: Uint8Array) => void;
}

interface socketData {
    roomId?: string;
}

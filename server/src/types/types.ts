export interface CursorPosition {
    lineNumber: number;
    column: number;
}

export interface Selection {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
}

export interface Presence {
    cursor?: CursorPosition;
    selection?: Selection;
    activeFile?: string;
}

export interface PresenceUpdate {
    userId: string;
    presence: Presence;
}

export interface ClientToServerEvents {
    "join-room": (roomId: string, username: string) => void;
    "update": (update: Uint8Array) => void;
    "presence-update": (presence: Presence) => void;
}

export interface ServerToClientEvents {
    "sync": (state: Uint8Array) => void;
    "update": (update: Uint8Array) => void;
    "presence-update": (presenceUpdate: PresenceUpdate) => void;
}

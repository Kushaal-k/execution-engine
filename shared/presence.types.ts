/**
 * Real-Time Presence & Remote Cursor Types
 * Shared between Frontend, Server, and Socket Handler
 */

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

export interface User {
    username: string;
    color: string;
    avatarUrl?: string;
}

export interface Presence {
    cursor?: CursorPosition;
    selection?: Selection;
    activeFile?: string;
}

export interface PresenceUpdate {
    userId: string;
    presence: Presence;
    user: User;
}

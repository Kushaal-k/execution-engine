import type { Presence, PresenceUpdate } from "./presence.types.js";
import type { WorkspaceSnapshot } from "./workspace.types.js";
import type { IExecutionRequest, IExecutionResponse } from "./execution.types.js";

export interface WorkspaceEvents {
    "create-file": (fileName: string, language: string, parentFolderId: string | null) => void;
    "delete-file": (fileId: string) => void;
    "rename-file": (fileId: string, newFileName: string) => void;
    "create-folder": (folderName: string, parentFolderId: string | null) => void;
    "delete-folder": (folderId: string) => void;
    "rename-folder": (folderId: string, newName: string) => void;
}

export interface ClientToServerEvents extends WorkspaceEvents {
    "join-room": (roomId: string, username: string) => void;
    "update": (update: Uint8Array) => void;
    "presence-update": (presence: Presence) => void;
    "user-left": (userId: string) => void;
    "submit-code": (request: IExecutionRequest) => void;
    "workspace:fs-event": (event: { roomId: string; type: "add" | "change" | "unlink"; path: string; content?: string }) => void;
}

export interface ServerToClientEvents {
    "sync": (snapshot: WorkspaceSnapshot) => void;
    "update": (update: Uint8Array) => void;
    "presence-update": (presenceUpdate: PresenceUpdate) => void;
    "user-left": (userId: string) => void;
    "execution-result": (result: IExecutionResponse) => void;
}

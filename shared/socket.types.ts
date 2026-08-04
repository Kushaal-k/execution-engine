/**
 * Socket.IO Bidirectional Event Contract Types
 * Shared between Server Socket Listener and Frontend Socket API
 */

import type { Presence, PresenceUpdate } from "./presence.types.js";
import type { WorkspaceSnapshot } from "./workspace.types.js";
import type { IExecutionRequest, IExecutionResponse } from "./execution.types.js";

export interface ClientToServerEvents {
    "join-room": (roomId: string, username: string) => void;
    "update": (update: Uint8Array) => void;
    "presence-update": (presence: Presence) => void;
    "user-left": (userId: string) => void;
    "submit-code": (request: IExecutionRequest) => void;
}

export interface ServerToClientEvents {
    "sync": (snapshot: WorkspaceSnapshot) => void;
    "update": (update: Uint8Array) => void;
    "presence-update": (presenceUpdate: PresenceUpdate) => void;
    "user-left": (userId: string) => void;
    "execution-result": (result: IExecutionResponse) => void;
}

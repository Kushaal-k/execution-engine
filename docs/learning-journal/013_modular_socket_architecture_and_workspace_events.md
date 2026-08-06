# 013 - Modular Socket Architecture & Workspace Event API

## Problem

As multi-file editing, folder management, user presence, and real-time cursor sync were added to the platform, `server/src/socket/socket.ts` grew into a monolithic file. Connection lifecycle logic (`join-room`, `disconnect`), presence updates (`presence-update`, cursor tracking), Yjs update broadcasts, and workspace structural mutations (`create-file`, `rename-file`, `delete-file`, `create-folder`, `rename-folder`) were all crammed into a single connection callback.

On the frontend, components were emitting raw string event names with inline payloads directly over socket instances, introducing code duplication, weak type safety, and fragile maintenance.

## Goal

1. Modularize server socket event handlers into domain-focused handler modules (`lifecycleHandlers.ts`, `presenceHandlers.ts`, `workspaceHandlers.ts`).
2. Implement a centralized client-side event API layer (`frontend/src/api/workspaceEvents.ts`) paired with shared TypeScript socket type definitions (`shared/socket.types.ts`).

## Architecture & Implementation

### Server Socket Modularization

The server connection entry point (`server/src/socket/socket.ts`) delegates incoming socket connections to domain-specific handler registrars:

```
┌─────────────────────────────────────────────────────────────┐
│ server/src/socket/socket.ts (Connection Dispatcher)       │
└──────────────────────────────┬──────────────────────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐
│ lifecycleHandlers│  │ presenceHandlers │  │ workspaceHandlers  │
│  - join-room     │  │  - presence-upd  │  │  - create-file     │
│  - disconnect    │  │  - yjs-update    │  │  - delete-file     │
│                  │  │                  │  │  - create-folder   │
└──────────────────┘  └──────────────────┘  └────────────────────┘
```

#### Socket Dispatcher (`server/src/socket/socket.ts`)

```typescript
import type { Server } from 'socket.io';
import { RoomManager } from '../room/room-manager.js';
import type { ClientToServerEvents, ServerToClientEvents } from "../types/types.js";
import { registerLifecycleHandlers } from './lifecycleHandlers.js';
import { registerPresenceHandlers } from './presenceHandlers.js';
import { registerWorkspaceHandlers } from './workspaceHandlers.js';

const roomManager = new RoomManager();

export function registerSocketHandlers(io: Server<ClientToServerEvents, ServerToClientEvents>) {
    io.on("connection", (socket) => {
        // Room Lifecycle & Session Handlers
        registerLifecycleHandlers(socket, roomManager);

        // Real-Time Document & Cursor Sync
        registerPresenceHandlers(socket, roomManager);

        // Workspace Structural Mutations
        registerWorkspaceHandlers(socket, io, roomManager);
    });
}
```

### Module Responsibilities

1. **`lifecycleHandlers.ts`**: Manages room join events, initial room state snapshot transfers to newly connected clients, and user disconnect cleanup.
2. **`presenceHandlers.ts`**: Broadcasts live cursor position movements, text selections, and raw Yjs binary updates (`yjs-update`) across active room members.
3. **`workspaceHandlers.ts`**: Executes file and folder structural CRUD requests against the `Workspace` instance, handles validation errors (e.g. duplicate names), and emits workspace updates to room participants.

### Frontend `workspaceEvents.ts` API Layer

Client-side socket emissions are encapsulated in typed wrapper functions:

```typescript
// frontend/src/api/workspaceEvents.ts
import { Socket } from "socket.io-client";

export const workspaceEvents = {
    createFile: (socket: Socket, name: string, language: string, parentFolderId: string | null) => {
        socket.emit("create-file", { name, language, parentFolderId });
    },
    deleteFile: (socket: Socket, fileId: string) => {
        socket.emit("delete-file", { fileId });
    },
    renameFile: (socket: Socket, fileId: string, name: string) => {
        socket.emit("rename-file", { fileId, name });
    },
    createFolder: (socket: Socket, name: string, parentFolderId: string | null) => {
        socket.emit("create-folder", { name, parentFolderId });
    },
    deleteFolder: (socket: Socket, folderId: string) => {
        socket.emit("delete-folder", { folderId });
    }
};
```

## Key Improvements & Benefits

- **Separation of Concerns**: Decouples presence state, connection management, and file system CRUD into isolated files.
- **End-to-End Type Safety**: Shared TypeScript interfaces ensure client and server events stay in sync during API modifications.
- **Clean Component Logic**: React components call `workspaceEvents.createFile()` instead of constructing manual `socket.emit("create-file", ...)` calls.

## Lessons Learned

- Grouping socket event listeners by feature domain prevents handler file growth and simplifies debugging network state.
- Abstracting raw socket calls behind a typed client API layer shields React UI components from WebSocket protocol details.

## Next Steps

- Build hierarchical tree data structures (`utils/workspaceTree.ts`) and recursive tree UI components (`WorkspaceTreeNode.tsx`).
- Add auto language detection based on file extensions and duplicate path validation.

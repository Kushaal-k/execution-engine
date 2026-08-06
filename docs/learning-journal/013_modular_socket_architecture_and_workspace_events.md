# 013 - Modular Socket Architecture & Client Workspace Event API

## Overview & Problem Statement

As multi-file editing, folder management, user presence, and real-time cursor sync were added, `server/src/socket/socket.ts` grew into a monolithic file mixing session lifecycles, cursor telemetry, Yjs binary delta broadcasts, and file CRUD actions. Server handlers were modularized by domain, and client socket calls were abstracted into a typed workspace event API layer.

## System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ Client UI View Components                                              │
│  └── Centralized Client API Facade (workspaceEvents.createFile)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Strongly Typed Socket Payload
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Server Connection Dispatcher (server/src/socket/socket.ts)             │
│  ├── lifecycleHandlers  (join-room, disconnect, room snapshots)        │
│  ├── presenceHandlers   (cursor position, selection, Yjs binary sync)  │
│  └── workspaceHandlers  (create, rename, delete files & folders)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Workspace CRDT State Engine                                            │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Server Handler Registrars**: Socket connections delegate event listeners to domain-specific registrar modules (`lifecycleHandlers`, `presenceHandlers`, `workspaceHandlers`).
2. **Workspace Event Handlers**: `workspaceHandlers` executes CRUD actions against `Workspace` instances, handles validation guards (duplicate names), and broadcasts updates to room members.
3. **Client API Facade**: React components invoke typed wrapper functions (`workspaceEvents.createFile()`) rather than constructing raw `socket.emit()` calls.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **Server Architecture** | Domain-Driven Registrars | Separates transient telemetry from critical structural file system mutations and room lifecycles. |
| **Type Safety** | Shared Contract Types | Shared TypeScript event interfaces (`shared/socket.types.ts`) guarantee contract alignment. |
| **Client Abstraction** | API Facade Pattern | Shields UI components from WebSocket details, simplifying testing and payload modifications. |

## Architectural Discussion

- **Abstracting Raw Socket Emissions**: Scattering string-based `socket.emit("event-name", payload)` calls across UI components leads to parameter typos, duplicate payload logic, and fragile refactoring. Abstracting socket calls behind a typed client API module centralizes payload construction and enforces type safety.
- **Domain-Driven Socket Event Routing**: Grouping handlers by domain responsibility (Session Lifecycle, Telemetry/Presence, Data Mutations) allows the primary connection handler to act as a clean router delegating socket instances to modular registrars.

## Current Limitations

- The frontend sidebar UI does not yet render nested folder tree structures visually.
- Sibling file/folder duplicate name checks need to be enforced across both client forms and server handlers.

## Future Improvements

- Implement an $O(N)$ linear-time tree construction algorithm (`createTree`) and recursive UI tree nodes.
- Add auto language detection based on file extensions.
- Support interactive STDIN stream execution in Docker sandboxes.

## Key Takeaways

- Categorizing socket handlers keeps server logic maintainable as real-time feature sets grow.
- Using shared TypeScript contract definitions prevents integration bugs between client and server.

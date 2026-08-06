# 010 - Real-Time Presence & Remote Cursors

## Overview & Problem Statement

While Yjs synchronized text changes, users could not see active collaborator cursor positions or text selections. To provide visual feedback during pair programming sessions, an Awareness and Remote Presence engine was built to render collaborator cursors, selection ranges, usernames, and cursor colors in Monaco Editor.

## System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ Client Browser (Local User)                                            │
│  ├── Monaco Editor Cursor Position Listener                            │
│  └── Socket Emission ("presence-update": line, column, selection)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Socket.IO Server Presence Registry                                     │
│  └── Ephemeral Room Map { socketId -> { username, color, position } }  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Broadcast Presence Map
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Client Browser (Collaborator Editor View)                              │
│  ├── Map Remote Presence to Range Coordinate Objects                   │
│  └── Monaco deltaDecorations API (Inject Dynamic Cursor CSS Badges)    │
└───────────────────────────────────┴────────────────────────────────────┘
```

1. **Motion Tracking**: Listens to Monaco cursor position events (`onDidChangeCursorPosition`).
2. **Ephemeral Transport**: Broadcasts lightweight presence payloads over Socket.IO (socket ID, username, assigned color, cursor coordinates, selection ranges).
3. **Monaco Delta Decorations**: Converts coordinate payloads into Monaco range objects and applies dynamic CSS classes (`editor.deltaDecorations()`) to render floating cursor pills and selection overlays.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **State Storage** | Ephemeral Socket Memory | Prevents CRDT document history and database bloat from high-frequency cursor movements. |
| **Lifecycle** | Connection-Bound Lifetime | Presence data exists only while connected; disconnecting purges badges instantly. |
| **DOM Batching** | `editor.deltaDecorations()` API | Diffs decoration range IDs in a single batch operation, minimizing DOM recalculation overhead. |

## Architectural Discussion

- **Separating Ephemeral Telemetry from Persistent CRDT State**: CRDTs manage persistent document data convergence. Presence data is ephemeral, transient, and high-frequency. Storing presence in CRDT history creates massive memory bloat. Ephemeral presence belongs in isolated volatile memory channels.
- **Batching DOM Decoration Operations**: Using Monaco's `editor.deltaDecorations()` API avoids destroying and recreating DOM elements on every update. `deltaDecorations` diffs existing decoration IDs against new target ranges in a single batch operation, minimizing DOM reflows.

## Current Limitations

- High-frequency presence emissions (on every keypress) can cause network traffic spikes if un-debounced.
- Presence and editor synchronization logic are mixed inside the primary `MonacoEditor.tsx` component, reducing component maintainability.
- Multi-file workspace tree management is not yet supported.

## Future Improvements

- Refactor frontend presence and Yjs synchronization logic into modular React custom hooks (`useYjsSync`, `useRemotePresence`).
- Implement debouncing for high-frequency user identity updates.
- Build a multi-file CRDT workspace model.

## Key Takeaways

- Separating volatile presence telemetry from persistent CRDT document state prevented history bloat in long-term storage.
- Utilizing Monaco's native `deltaDecorations` API enabled smooth multi-cursor rendering without DOM reflow stuttering.

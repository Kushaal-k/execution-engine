# 011 - Modular Custom Hooks & Monaco Decorations

## Overview & Problem Statement

Combining WebSocket connection lifecycles, CRDT bindings, DOM decoration calculations, and UI view rendering inside `MonacoEditor.tsx` created a monolithic component difficult to maintain and test. The frontend architecture was refactored by extracting real-time presence and Yjs synchronization into modular React custom hooks and helper modules.

## System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ MonacoEditor.tsx (Pure View Component)                                 │
├───────────────────────────────────┬────────────────────────────────────┤
│ Custom Hooks                      │ Helper Utility Modules             │
│  ├── useYjsSync.ts                │  └── monacoDecorations.ts          │
│  └── useRemotePresence.ts         │                                    │
└───────────────────────────────────┴────────────────────────────────────┘
                  │                                  │
                  ▼                                  ▼
┌───────────────────────────────────┐  ┌─────────────────────────────────┐
│ WebSocket & Yjs Document Manager  │  │ Monaco DOM Delta Decorations    │
└───────────────────────────────────┘  └─────────────────────────────────┘
```

1. **`useYjsSync` Hook**: Manages `Y.Doc` initialization, WebSocket provider lifecycles, `y-monaco` binding creation, and teardown cleanup on unmount.
2. **`useRemotePresence` Hook**: Manages presence socket listeners, tracks local cursor shifts, and exposes connected collaborator states.
3. **`monacoDecorations` Utility**: Pure helper module responsible for calculating text ranges and invoking `editor.deltaDecorations()`.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **Separation of Concerns** | Custom React Hooks | Decouples network state management from component DOM rendering logic. |
| **Resource Safety** | Consolidated Unmount Teardowns | Consolidates cleanup logic (destroying Yjs bindings, removing listeners) inside hook teardowns. |
| **Pure Utilities** | Out-of-Render Calculations | Computes range objects outside the React render loop to prevent re-render thrashing. |

## Architectural Discussion

- **Encapsulating Network Logic in Custom Hooks**: Combining socket events, CRDT bindings, and DOM rendering inside UI components creates monolithic files prone to stale state closures, re-render loops, and dangling listener memory leaks. Custom hooks encapsulate side effects and provide clean subscription lifecycle APIs.
- **Out-of-Render Calculation Isolation**: Moving calculations (like converting socket cursor coordinates into Monaco range objects) into pure utility functions keeps computation outside the React render cycle, preventing state mutations and re-render thrashing.

## Current Limitations

- Editor sessions remain constrained to single-file buffers.
- Client socket event emissions rely on inline string payloads rather than a centralized client API facade.

## Future Improvements

- Design a CRDT `Workspace` data model supporting nested folders and multi-file text buffers.
- Modularize server socket event handlers into domain-specific registrars (`lifecycle`, `presence`, `workspace`).
- Create a centralized client-side `workspaceEvents` API layer.

## Key Takeaways

- Extracting network state management into custom React hooks resolved re-render loops and guaranteed clean teardown of WebSocket listeners.
- Moving coordinate calculations into pure utility modules kept heavy DOM calculations outside the React render loop.

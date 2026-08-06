# 009 - Collaborative Real-Time Editing (Yjs CRDTs)

## Overview & Problem Statement

Enabling multiple developers to edit the same file simultaneously introduces concurrent editing conflicts. Simple string replacements or central file locks result in lost edits, cursor jumps, or document corruption. To achieve conflict-free real-time collaboration, Yjs based on Conflict-Free Replicated Data Types (CRDTs) was integrated.

## System Architecture & Data Flow

```
┌────────────────────────────────┐                             ┌────────────────────────────────┐
│ Client A (User A Editor)       │                             │ Client B (User B Editor)       │
│ ┌────────────────────────────┐ │                             │ ┌────────────────────────────┐ │
│ │ Monaco Editor View         │ │                             │ │ Monaco Editor View         │ │
│ └──────────────┬─────────────┘ │                             │ └──────────────┬─────────────┘ │
│                │ Local Edit    │                             │                │ Local Edit    │
│                ▼               │                             │                ▼               │
│ ┌────────────────────────────┐ │     Binary Yjs Update Delta │ ┌────────────────────────────┐ │
│ │ Y.Doc Shared Text CRDT     │ ├────────────────────────────►│ │ Y.Doc Shared Text CRDT     │ │
│ └────────────────────────────┘ │   (via Socket.IO Transport) │ └────────────────────────────┘ │
└────────────────────────────────┘                             └────────────────────────────────┘
```

1. **CRDT Data Representation**: Text is represented as an ordered sequence of character items tagged with unique Client ID and Clock Sequence metadata.
2. **Deterministic Merging**: Edits apply locally first and broadcast compressed binary state updates (`Uint8Array`) over WebSockets.
3. **Eventual Consistency**: All nodes apply incoming state vectors deterministically, converging on identical document state without requiring a central lock manager.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **Convergence Model** | CRDT (Yjs) vs OT | Guarantees eventual consistency mathematically without central server operation transformation logic. |
| **Network Encoding** | Binary Typed Arrays (`Uint8Array`) | Struct-offset binary encoding minimizes WebSocket payload size and memory overhead. |
| **Memory Trade-Off** | Historical Metadata Overhead | Character insertion items retain clock metadata in memory to guarantee historical convergence. |

## Architectural Discussion

- **CRDT vs Operational Transformation (OT)**: OT relies on a central server to rewrite operation index offsets relative to concurrent edits, creating a server bottleneck. CRDTs attach immutable logical timestamps to data structures, enabling nodes to merge updates out-of-order and arrive at identical state deterministically.
- **State Vector Synchronization Protocol**: Yjs uses **State Vectors**. When a client joins, it transmits its current state vector (summary of known clock sequences per client). The server or peer calculates missing document updates and returns a minimal binary update delta.

## Current Limitations

- Collaboration is restricted to a single shared file buffer per room; multi-file project workspaces are not supported.
- Users cannot visually see collaborator cursor line positions or selection highlights.
- Collaborative session state is stored in memory and lost if all room participants disconnect.

## Future Improvements

- Build an ephemeral presence engine to track remote cursor positions and selection ranges.
- Expand the single-file Yjs model into a multi-file, nested directory Workspace CRDT model.
- Persist room session snapshots to database storage for persistent workspace loading.

## Key Takeaways

- Yjs CRDTs solved multi-user text editing conflicts deterministically without requiring a central lock manager or complex OT server transformations.
- Compacting document state updates into binary typed arrays (`Uint8Array`) kept WebSocket network bandwidth utilization low.

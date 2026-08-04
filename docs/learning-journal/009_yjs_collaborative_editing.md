# 009 - Collaborative Editing with Yjs and y-monaco

## Problem

Building a multi-user collaborative code editor presents critical synchronization challenges: if two users edit the same document concurrently, naive text replacement causes overwrites, cursor jumping, lost edits, and race conditions.

## Goal

Implement conflict-free real-time collaborative code editing in Monaco Editor using **Yjs** (a high-performance Conflict-free Replicated Data Type / CRDT library) and `y-monaco` bindings over a dedicated WebSocket sync server.

## Architecture & Implementation

Integrated `yjs`, `y-websocket`, and `y-monaco` on the frontend and established a dedicated collaborative sync server.

### Real-Time CRDT Architecture

```
┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
│ Client A                        │                 │ Client B                        │
│ ┌─────────────────────────────┐ │                 │ ┌─────────────────────────────┐ │
│ │ Monaco Editor Component     │ │                 │ │ Monaco Editor Component     │ │
│ └──────────────┬──────────────┘ │                 │ └──────────────┬──────────────┘ │
│                │ y-monaco       │                 │                │ y-monaco       │
│ ┌──────────────▼──────────────┐ │   WebSocket     │ ┌──────────────▼──────────────┐ │
│ │ Y.Doc (Shared Y.Text)       │ ├─────────────────┤ │ Y.Doc (Shared Y.Text)       │ │
│ └─────────────────────────────┘ │ (Sync Protocol) │ └─────────────────────────────┘ │
└─────────────────────────────────┘                 └─────────────────────────────────┘
```

### Frontend Integration

```typescript
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import * as monaco from 'monaco-editor';

// 1. Initialize shared Yjs Document
const doc = new Y.Doc();
const provider = new WebsocketProvider('ws://localhost:5000', 'execution-room', doc);
const yText = doc.getText('monaco');

// 2. Bind Yjs shared text model to Monaco Editor model
const editorModel = editor.getModel();
const binding = new MonacoBinding(
  yText,
  editorModel,
  new Set([editor]),
  provider.awareness
);
```

## Why Yjs & CRDTs?

- **Conflict-Free Convergence**: CRDT algorithm guarantees all connected clients converge to identical document state regardless of network latency, packet reordering, or concurrent edits.
- **`y-monaco` Native Binding**: Automatically translates Yjs text delta updates into Monaco Editor transaction operations without triggering infinite update loops.
- **Decoupled Architecture**: Document synchronization operates independently from code execution pipelines.

## Problems Discovered & Lessons Learned

- Direct mutation of Monaco editor model values (`editor.setValue()`) breaks Yjs internal model bindings and destroys document history. Edits must pass strictly through the bound `Y.Text` object.
- Proper cleanup on component unmount (`binding.destroy()`, `provider.destroy()`) is essential to prevent WebSocket connection leaks and duplicate editor listeners.

## Next Steps

- Implement user presence (connected user list, usernames, cursor colors).
- Display remote user cursors and text selections dynamically in Monaco Editor.

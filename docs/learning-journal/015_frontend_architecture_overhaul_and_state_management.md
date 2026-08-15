# 015 - Frontend Architecture Overhaul & State Management

## Overview & Problem Statement

As the Collaborative Execution Engine expanded with real-time CRDT editing, remote cursor presence, interactive xterm terminals, and asynchronous job execution, the frontend architecture experienced severe friction and development bottlenecks:

1. **Severe Prop Drilling & State Fragmentation**: Workspace metadata (`files`, `folders`, `workspaceMetadata`) was retrieved at the top level and passed down 4–5 component layers (`IDE` -> `Sidebar` -> recursive `WorkspaceTreeNode`). `WorkspaceTreeNode` had ballooned to over 340 lines because it mingled recursive rendering, duplicate path validation, inline rename/creation state, and socket event emissions.
2. **Ambiguous Dual-Socket Communication & Memory Leaks**: The frontend interacts with two backend servers: the Collaboration Server (Port 3000: Yjs CRDT, workspace CRUD, presence) and the Execution Engine (Port 5000: job queue submissions, streaming runner results, xterm terminal PTY sessions). Sockets were weakly typed as `socket` and `socket2`. Dynamic listeners (`socket.on(result:${jobId})`) lacked teardown mechanics, causing listener memory leaks upon consecutive code runs.
3. **Missing Multi-File Tab Management**: The editor only tracked a single active file ID. Opening another file immediately overwrote the active view without tab retention or multi-file navigation.
4. **Disjointed Bottom Panel Layout**: Output telemetry and the interactive terminal were rendered as competing, stacked elements rather than a unified docked workbench panel.
5. **Terminal Session Lifecycle Incomplete**: `TerminalView` mounted `xterm.js` and listened for output events, but never invoked `terminalEvents.openTerminal` on mount, resulting in disconnected PTY sessions.

---

## Architecture Decision Records (ADRs)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       FRONTEND WORKBENCH                                    │
│                                                                                             │
│  ┌───────────────────────────┐  ┌───────────────────────────────────┐  ┌─────────────────┐  │
│  │      workspaceStore       │  │          executionStore           │  │    userStore    │  │
│  │  - files, folders         │  │  - status ("Queued"|"Completed")  │  │  - username     │  │
│  │  - openFileIds, activeId  │  │  - response (stdout, metrics)     │  │  - activeUsers  │  │
│  │  - Y.Doc CRDT instance    │  │  - stdin, code, language          │  │                 │  │
│  └─────────────┬─────────────┘  └─────────────────┬─────────────────┘  └────────┬────────┘  │
│                │                                  │                             │           │
│                ▼                                  ▼                             ▼           │
│  ┌───────────────────────────┐  ┌───────────────────────────────────┐  ┌─────────────────┐  │
│  │    Sidebar & File Tree    │  │    EditorTabs & Monaco Editor     │  │     Topbar      │  │
│  │    (Recursive Tree View)  │  │    (Yjs MonacoBinding + Presence) │  │  (Status & Run) │  │
│  └───────────────────────────┘  └───────────────────────────────────┘  └─────────────────┘  │
│                                                   │                                         │
│                                                   ▼                                         │
│                                 ┌───────────────────────────────────┐                       │
│                                 │     BottomPanel (Docked Drawer)   │                       │
│                                 │  [ Output | Terminal | Stdin ]    │                       │
│                                 └───────────────────────────────────┘                       │
└───────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     │                                                     │
                     ▼                                                     ▼
     ┌───────────────────────────────┐                     ┌───────────────────────────────┐
     │   collabSocket (Port 3000)    │                     │   executionSocket (Port 5000) │
     │  - join-room / sync / update  │                     │  - POST /api/response         │
     │  - presence-update (cursors)  │                     │  - result:${jobId} (auto-off) │
     │  - workspace CRUD events      │                     │  - terminal:open/input/output │
     └───────────────────────────────┘                     └───────────────────────────────┘
```

---

### ADR 1: Centralized State Management with Zustand

* **Decision**: Adopt **Zustand** as the primary state store layer, split into domain-focused stores: `workspaceStore`, `executionStore`, and `userStore`.
* **Rationale**:
  * **Zero Boilerplate**: Avoids Redux action/reducer verbosity while maintaining strict TypeScript typing.
  * **Atomic Selector Subscriptions**: Components subscribe only to the slices they depend on (e.g., `const activeFileId = useWorkspaceStore(s => s.activeFileId)`), eliminating unnecessary re-renders across the entire component tree.
  * **Elimination of Prop-Drilling**: `WorkspaceTreeNode` can query parent folders, trigger renames, and create files directly from `workspaceStore` without passing metadata arrays down recursive iterations.

---

### ADR 2: Strict Dual-Socket Isolation & Lifecycle Safety

* **Decision**: Rename and strictly isolate sockets in `api/socket.ts` as `collabSocket` (Port 3000) and `executionSocket` (Port 5000), driven by centralized configuration in `config/env.ts`.
* **Rationale**:
  * Eliminates confusion between arbitrary names like `socket` and `socket2`.
  * **Auto-Cleaning Result Listeners**: In `executionStore.executeCode()`, when a job result arrives (`Completed` or `Failed`), the socket listener explicitly unsubscribes itself (`executionSocket.off(channel, handleResult)`), preventing memory leaks and duplicate execution handler invocations.

```ts
// Self-cleaning socket result listener pattern
const channel = `result:${data.jobId}`;
const handleResult = (result: IExecutionResponse) => {
  if (result.status === "Completed" || result.status === "Failed") {
    set({ status: result.status, response: result, isLoading: false });
    executionSocket.off(channel, handleResult); // Clean self-teardown
  }
};
executionSocket.on(channel, handleResult);
```

---

### ADR 3: Multi-File Tab Model with Active File Buffer Sync

* **Decision**: Introduce `openFileIds: string[]` and `activeFileId: string | null` in `workspaceStore`, rendered via `EditorTabs.tsx`.
* **Rationale**:
  * Users can navigate between multiple open files without losing open document context.
  * When a file is deleted from the sidebar, `workspaceStore.deleteFile()` automatically closes its tab and safely shifts focus to the adjacent open file.
  * Monaco dynamically binds to the active file's Yjs text buffer (`doc.getText(activeFileId)`) with automatic observer cleanup on switch.

---

### ADR 4: Unified Docked Bottom Panel (Output, Terminal, Stdin)

* **Decision**: Replace separate, competing bottom widgets with a docked `BottomPanel.tsx` component containing:
  1. **Output Tab**: Formatted stdout, stderr, execution time (ms), memory usage (KB/MB), and exit codes, plus copy and clear actions.
  2. **Terminal Tab**: Interactive xterm.js instance connected to the container runtime.
  3. **Stdin Tab**: Dedicated textarea for submitting standard input strings to batch jobs.
  4. **Collapsible Header**: Single-click minimize/expand drawer.
* **Rationale**: Gives the IDE a cohesive layout mirroring standard development environments (VS Code / Replit) while keeping screen real estate maximized for code editing.

---

### ADR 5: Terminal Session PTY Lifecycle Initialization

* **Decision**: Update `TerminalView.tsx` to generate a stable session UUID, emit `terminal:open` with the current workspace ID and language on mount, and emit `terminal:destroy` on unmount.
* **Rationale**: The backend `terminalHandler.ts` requires a `terminal:open` event to instantiate the container PTY process. Without this handshake, the terminal listener received no output and input was discarded.

---

## Before vs. After Architecture Comparison

| Dimension | Previous State | Refactored Architecture |
| :--- | :--- | :--- |
| **State Sharing** | 5-level prop drilling (`IDE` -> `Sidebar` -> `TreeNode`) | Direct Zustand atomic store subscriptions |
| **Component Size** | `WorkspaceTreeNode` was 343 lines with mixed concerns | Clean single-responsibility components with store actions |
| **Socket Management** | Ambiguous `socket`/`socket2`, uncleaned listeners | Typed `collabSocket` (3000) & `executionSocket` (5000) with auto-teardown |
| **File Navigation** | Single file selection only; no tabs | Multi-file `EditorTabs` with open/close/switch states |
| **Terminal Integration** | Uninitialized PTY session, no `openTerminal` handshake | Full session handshake (`openTerminal`), streamed I/O, and clean disposal |
| **Bottom UI Layout** | Statically stacked `OutputArea` + `TerminalView` | Docked `BottomPanel` with Output / Terminal / Stdin tabs |
| **Type Safety & Build** | Unresolved Monaco ES imports in Vite build | Clean alias resolution and 100% ESLint & TypeScript compilation pass |

---

## Key Takeaways & Lessons Learned

1. **Decouple Networking from UI Components**: Sockets and asynchronous job polling should be encapsulated within dedicated service stores rather than triggered directly inside component event handlers.
2. **Clean Up Dynamic Real-Time Listeners**: Any temporary socket subscription (such as job results or terminal streams) must have an unambiguous unsubscription path to prevent memory leaks and duplicate state updates.
3. **Atomic Selectors Prevent Render Cascades**: In a collaborative editor where cursor positions and keystrokes fire at sub-50ms intervals, using fine-grained Zustand selectors prevents editor keystrokes from re-rendering the sidebar or topbar.

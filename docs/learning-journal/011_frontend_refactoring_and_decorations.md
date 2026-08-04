# 011 - Modular Hooks & Multi-User Monaco Decorations

## Problem

As collaborative editing, real-time presence, Yjs document synchronization, and remote cursor decorations were added, the main `MonacoEditor.tsx` component grew monolithic (over 300+ lines). Mixing WebSocket lifecycle hooks, Monaco model bindings, custom CSS styling, and UI state in a single component degraded readability, made testing difficult, and increased bug risk.

## Goal

Refactor the frontend collaboration architecture by decomposing real-time presence and document synchronization into modular React hooks (`useRemotePresence`, `useYjsSync`), extracting decoration utilities into dedicated modules (`monacoDecorations.ts`), and adding a connected users list UI.

## Architecture & Refactored Structure

Separated concerns cleanly between data management, editor model bindings, and UI presentation components.

### Modular Architecture

```
┌───────────────────────────────────────────────────────────┐
│ MonacoEditor.tsx (UI Component View)                      │
├───────────────────────────────┬───────────────────────────┤
│ Custom Hooks                  │ Helper Utility Modules    │
│  ├── useYjsSync.ts            │  └── monacoDecorations.ts │
│  └── useRemotePresence.ts     │                           │
└───────────────────────────────┴───────────────────────────┘
                                              │
                                              ▼
┌───────────────────────────────────────────────────────────┐
│ Sidebar.tsx (Connected User List & Active Status)         │
└───────────────────────────────────────────────────────────┘
```

### Module Responsibilities

1. **`useYjsSync.ts`**: Encapsulates `Y.Doc` initialization, WebSocket provider connection, `y-monaco` binding lifecycle, and automatic cleanup on unmount.
2. **`useRemotePresence.ts`**: Manages Socket.IO presence connection, emits local cursor movements, listens for remote presence updates, and returns a clean map of connected users.
3. **`monacoDecorations.ts`**: Pure helper module responsible for calculating Monaco text range objects, injecting user-specific CSS classes, and invoking `editor.deltaDecorations()`.
4. **`Sidebar.tsx`**: Renders active collaborators, their assigned cursor colors, connection status badges, and total user counts.

### Key Refactored Code Example

```typescript
// MonacoEditor.tsx
export const MonacoEditor = ({ roomId, username, language }: EditorProps) => {
  const [editorRef, setEditorRef] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  // Modular custom hooks for state & sync
  const { isConnected } = useYjsSync(editorRef, roomId);
  const { remoteUsers } = useRemotePresence(editorRef, roomId, username);

  // Effect handles remote cursor decoration updates safely
  useEffect(() => {
    if (!editorRef) return;
    updateRemoteDecorations(editorRef, remoteUsers);
  }, [editorRef, remoteUsers]);

  return <div id="editor-container" />;
};
```

## Key Improvements & Benefits

- **Separation of Concerns**: UI rendering is completely decoupled from Socket.IO events, Yjs CRDT operations, and Monaco DOM manipulation.
- **Leak Prevention**: Explicit lifecycle hook cleanup ensures WebSocket listeners and Monaco decorations are destroyed when users navigate away or disconnect.
- **Enhanced UI Awareness**: Users can see all active collaborators in the sidebar with matching cursor badges.

## Lessons Learned

- Complex real-time features should be broken down into modular custom hooks early to keep UI view components focused and maintainable.
- Isolating DOM-manipulating utilities (like Monaco decoration state calculation) into pure functions eliminates unexpected React render loops and side effects.

## Next Steps

- Implement multi-room support and room access permissions.
- Save collaborative session state to persistent backend storage (MongoDB).
- Add collaborative execution output streaming so all participants view code output simultaneously.

# 003 - Browser IDE Integration (Monaco Editor)

## Overview & Problem Statement

Standard HTML `<textarea>` elements lack syntax highlighting, indentation handling, line numbering, and granular event APIs required for modern browser-based IDEs. To provide a professional developer environment and prepare for multi-user real-time cursor tracking, Monaco Editor (the core editing engine powering VS Code) was integrated into the client application.

## System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ React Application View Layer                                           │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Monaco Editor Container (DOM Element)                              │ │
│ │ ┌────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Monaco Text Model (ICodeEditor Instance)                       │ │ │
│ │ │  ├── Syntax Highlighting & Tokenization Rules                  │ │ │
│ │ │  ├── Line Numbers, Indentation, & Code Formatting              │ │ │
│ │ │  └── Viewport Cursor & Selection Range Event Emitters          │ │ │
│ │ └────────────────────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

Monaco decouples UI presentation from its underlying Text Model. The React view container mounts the editor instance, listens to text model mutation events, and synchronizes document state with application state.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **UX & Feature Parity** | Monaco Editor Integration | Delivers industry-standard developer UX including tokenization, keybindings, and formatting. |
| **API Surface** | Text Model Range APIs | Exposes granular coordinate and decoration APIs required for multi-cursor overlays. |
| **Footprint & Lifecycle** | Web Worker Assets & Disposal | Introduces ~5MB static assets; requires explicit `editor.dispose()` to prevent DOM leaks. |

## Architectural Discussion

- **Decoupling Text Models from Editor Views**: Separating data state (Text Model) from presentation (Editor View) allows application instances to swap active file buffers without destroying or re-mounting the DOM container, optimizing tab-switching performance.
- **SPA Memory Management**: Monaco editor instances, text models, and event listeners persist in V8 heap memory if not garbage collected. SPA components must explicitly invoke `editor.dispose()` and unsubscribe from model event listeners within component unmount lifecycle hooks.

## Current Limitations

- The editor only supports single-file editing without project workspace tree views.
- Collaborative editing is not yet supported; changes are local to the browser.
- Large initial static bundle size (~5MB Web Worker assets) increases initial load time.

## Future Improvements

- Integrate Conflict-Free Replicated Data Types (Yjs CRDTs) for multi-user collaborative editing.
- Build custom hooks to manage WebSocket real-time presence and remote cursor decorations.
- Add workspace tab switching and project file tree navigation.

## Key Takeaways

- Monaco's Text Model separation enabled fast buffer switching, but required strict component lifecycle cleanup (`dispose()`) to prevent V8 heap leaks in single-page applications.
- Monaco's range APIs provided the necessary abstractions for downstream collaborative cursor overlays.
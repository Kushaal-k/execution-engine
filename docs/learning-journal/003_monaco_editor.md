# 003 - Monaco Editor Integration

## Problem

A standard HTML `<textarea>` or basic input element lacks syntax highlighting, code indentation, line numbering, multi-language support, and diagnostic capabilities. To deliver an authentic IDE experience, the frontend required a production-grade code editor component capable of supporting modern code editing and future collaborative extensions.

## Goal

Integrate Monaco Editor (the core editor powering Visual Studio Code) into the React frontend to provide syntax highlighting, customizable editor settings, and language selection.

## Architecture & Implementation

Integrated `@monaco-editor/react` into the React application, configuring editor models and theme settings.

### Component Structure

```
┌────────────────────────────────────────────────────────┐
│ Topbar (Language Selection: C++, Python, JS, Java)     │
├────────────────────────────────────────────────────────┤
│ Monaco Editor Component                                │
│  ├── Syntax Highlighting (Monaco Tokenizer)            │
│  ├── Line Numbers & Active Line Highlights             │
│  └── Code Model (monaco.editor.createModel)            │
└────────────────────────────────────────────────────────┘
```

### Key Setup Code

```tsx
import Editor from '@monaco-editor/react';

export const CodeEditor = ({ language, code, onChange }) => {
  return (
    <Editor
      height="80vh"
      language={language}
      theme="vs-dark"
      value={code}
      onChange={(value) => onChange(value || '')}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
      }}
    />
  );
};
```

## Alternatives Considered

| Editor | Pros | Cons | Decision |
| :--- | :--- | :--- | :--- |
| **HTML `<textarea>`** | Zero dependencies, lightweight | No syntax highlighting, no line numbers, poor UX | Rejected |
| **CodeMirror** | Lightweight, highly modular | Smaller default feature set, API differs from VS Code | Rejected |
| **Monaco Editor** | Powers VS Code, rich decorations API, native multi-language support, ideal for CRDT bindings | Larger JavaScript bundle size, complex API surface | **Selected** |

## Why Monaco Editor?

- **VS Code Ecosystem Familiarity**: Provides familiar keybindings, indentation rules, and language tokenizers out of the box.
- **Decorations API**: Monaco exposes `editor.deltaDecorations()`, allowing programmatically adding custom CSS classes to lines, inline widgets, and selection highlights (essential for remote cursors).
- **CRDT Integration Foundation**: Popular real-time collaboration libraries like `y-monaco` natively support Monaco Editor models.

## Tradeoffs & Challenges

- **Bundle Size**: Monaco adds ~2-3MB of JavaScript workers to the frontend bundle.
- **Layout Resizing**: Monaco requires layout recalculation on window or panel resize, requiring `automaticLayout: true` or manual container resize observers.

## Lessons Learned

- Choosing an industry-standard editor early prevents costly migrations when adding advanced editor features later.
- Monaco's rich API surface provided the exact primitives required for multi-user collaboration and cursor decorations added in later iterations.

## Next Steps

- Move code execution into containerized environments (Docker).
- Connect the frontend editor state to real-time collaboration mechanisms (Yjs & WebSockets).
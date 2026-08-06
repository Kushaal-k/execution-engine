# 014 - Hierarchical Workspace Tree & Sidebar Tree View

## Overview & Problem Statement

Storing files and folders as flat CRDT maps was optimal for network synchronization, but displaying flat lists in the user interface failed to convey directory hierarchies. To provide an authentic IDE file explorer, a client-side **Tree Construction Utility**, a **Recursive Tree Node Component**, extension-based **Language Auto-Detection**, and sibling path validation were implemented.

## System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ CRDT State Input: Flat Arrays of File & Folder Metadata                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Tree Construction Algorithm (createTree in workspaceTree.ts)           │
│  1. Map folders by ID into TreeNode lookup dictionary                  │
│  2. Iterate items: attach child nodes to parent folder's children array│
│  3. Fallback: place orphan or root items into rootNodes array          │
│  4. Sort deterministically: Folders above Files, sorted Alphabetically │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Hierarchical TreeNode Array
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Recursive UI Component (WorkspaceTreeNode.tsx)                         │
│  ├── Folder Nodes: Toggle open/closed state, render children           │
│  ├── File Nodes: Set active editor tab, render language/file icons     │
│  └── Inline Inputs: Inline renaming, creating subfiles or subfolders   │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Tree Transformer (`createTree`)**: Converts flat metadata arrays into nested `TreeNode` structures in $O(N)$ linear time using a hash map lookup.
2. **Recursive View (`WorkspaceTreeNode`)**: Renders nested items recursively, managing collapsible folder states and inline editing fields.
3. **Extension Auto-Detection (`languageDetector`)**: Maps file extensions (`.py` -> `python`, `.ts` -> `typescript`, `.cpp` -> `cpp`) to auto-configure Monaco syntax modes.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **Tree Transformation** | Client-Side $O(N)$ Hash Map | Keeps CRDT payloads flat while giving client flexibility to structure and sort UI trees. |
| **Visual Consistency** | Deterministic Folder-First Sort | Sorting folders above files alphabetically guarantees consistent multi-user layout. |
| **Render Performance** | Memoized Sub-Tree Toggles | Folder toggles re-render only target sub-trees without triggering full sidebar reflows. |

## Architectural Discussion

- **Linear-Time Tree Construction Algorithm**: Using a two-pass Hash Map algorithm converts flat records into nested trees in $O(N)$ time complexity. First pass creates `TreeNode` objects in a lookup map by ID. Second pass iterates through records, retrieving parent nodes from the map in $O(1)$ time and pushing child nodes into parent `children` arrays, or into `rootNodes` if no parent exists.
- **Optimizing Recursive Tree Components in React**: Assigning immutable UUIDs as React `key` props, memoizing node sub-trees (`React.memo`), and keeping collapsible open/closed toggle states localized to individual node components ensures expanding or collapsing a folder re-renders only that sub-tree without triggering full sidebar re-renders.

## Current Limitations

- Code execution runner fails for programs expecting user standard input (STDIN, e.g. `input()` in Python or `cin` in C++).
- High-frequency username editing in UI fields triggers duplicate socket presence join events.

## Future Improvements

- Support interactive STDIN input stream piping into Docker containers (`container.attach`).
- Debounce username identity updates to prevent socket presence thrashing.
- Overhaul IDE user interface into a clean minimal layout with execution telemetry metrics.

## Key Takeaways

- Transforming flat parent-referencing data into nested trees on the client kept CRDT network payloads simple while giving the UI full layout flexibility.
- Inferring editor syntax modes from file extensions eliminated tedious manual dropdown configuration.

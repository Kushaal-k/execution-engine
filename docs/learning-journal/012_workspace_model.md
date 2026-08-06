# 012 - Multi-File CRDT Workspace Model

## Overview & Problem Statement

Expanding single-file editing into a multi-file IDE required organizing files, nested directories, metadata, and per-file `Y.Text` buffers in a synchronized real-time document structure. To handle concurrent structural edits (create, rename, move, delete) without data corruption, a CRDT-backed `Workspace` data model was implemented.

## System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ Workspace (Encapsulated CRDT Document Engine)                          │
│ └── Y.Doc Instance                                                     │
│      ├── files (Y.Map<FileMetadata>)                                   │
│      │      ├── file_id_1: { id, name: "index.ts", parentFolderId }    │
│      │      └── file_id_2: { id, name: "app.py", parentFolderId }      │
│      ├── folders (Y.Map<FolderMetadata>)                               │
│      │      └── folder_id_1: { id, name: "src", parentFolderId }       │
│      ├── metadata (Y.Map<WorkspaceMetadata>)                           │
│      │      └── workspace: { id, name: "Project", createdAt }          │
│      └── dynamic text buffers (doc.getText(fileId))                    │
│             ├── "file_id_1" -> Y.Text ("console.log('hello');")        │
│             └── "file_id_2" -> Y.Text ("print('world')")               │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Flat Entity Maps**: File and folder metadata are stored in flat `Y.Map` collections (`files`, `folders`), referencing parent directories via explicit `parentFolderId` UUID pointers.
2. **Dynamic Text Buffers per File UUID**: Text content for each file is stored dynamically in a `Y.Text` buffer indexed by immutable file UUIDs (`doc.getText(fileId)`).
3. **Cascading Operations & Guards**: Deleting a folder recursively purges descendant files and subfolders. Moving folders includes an `isDescendant` check to prevent directory cycle bugs.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **Data Schema** | Flat Maps + Relational Pointers | Eliminates structural merge conflicts during concurrent file moves or folder re-parenting. |
| **Buffer Lifecycles** | Immutable UUID Binding | Binding `Y.Text` to file UUIDs ensures renaming or moving files leaves text buffers intact. |
| **Safety Guards** | Ancestor Lineage Check | `isDescendant` check rejects operations attempting to move parent folders into sub-branches. |

## Architectural Discussion

- **Flat Maps vs Nested JSON Trees**: Deeply nested JSON tree objects in CRDTs create merge conflict vulnerabilities when two users concurrently move or rename nested nodes. Flat maps with explicit `parentFolderId` UUID pointers reduce structural mutations to simple key-value updates, making merges deterministic and conflict-free.
- **Cycle Prevention Mechanics**: The `isDescendant` algorithm traverses target parent folder lineages up to the root. Before applying a folder move, if the folder being moved is detected in the target's ancestor chain, the operation is rejected to prevent cyclic directory graphs.

## Current Limitations

- Workspace state is maintained in server RAM during active sessions; persistent database loading is not fully connected.
- Client UI sidebar still displays flat metadata arrays rather than a hierarchical nested directory tree.
- File creation requires manual syntax language selection rather than inferring from file extensions.

## Future Improvements

- Build a client-side tree transformer (`createTree`) and recursive sidebar tree component (`WorkspaceTreeNode`).
- Implement extension-based language auto-detection (`languageDetector`).
- Modularize server socket handlers to process workspace structural mutations.

## Key Takeaways

- Relational parent pointers in flat maps are simpler to synchronize in CRDTs than nested object graphs.
- Decoupling file metadata (`FileMetadata`) from text buffers (`Y.Text`) enables fast directory indexing without loading full file contents into RAM.
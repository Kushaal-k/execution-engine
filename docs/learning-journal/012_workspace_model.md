# 012 - Multi-File CRDT Workspace Model

## Problem

In single-file collaborative editing, a single `Y.Doc` with one `Y.Text` buffer was sufficient. However, expanding the platform into a full multi-file IDE requires organizing multiple files, nested directory structures, file metadata (e.g. `fileId`, `name`, `language`, `parentFolderId`), and folder metadata (`folderId`, `name`, `parentFolderId`) in a synchronized real-time document structure.

Without a structured workspace CRDT model, tracking file creation, renaming, moving, and deletions across concurrent sessions would lead to out-of-sync file trees, race conditions, or lost text buffers.

## Goal

Design and implement a CRDT-backed `Workspace` abstraction (`server/src/room/workspace.ts` and `@execution-engine/shared`) that encapsulates Yjs shared maps for files, folders, metadata, and per-file `Y.Text` buffers, providing conflict-free real-time workspace mutations.

## Architecture & Data Model

The `Workspace` class encapsulates a single `Y.Doc` instance containing three primary Yjs shared maps:
1. `files`: `Y.Map<FileMetadata>` — Stores file attributes (`id`, `name`, `language`, `parentFolderId`).
2. `folders`: `Y.Map<FolderMetadata>` — Stores folder attributes (`id`, `name`, `parentFolderId`).
3. `metadata`: `Y.Map<WorkspaceMetadata>` — Stores workspace-level attributes (`id`, `name`, `createdAt`, `updatedAt`).

Each file's text content is managed in a dynamic `Y.Text` buffer indexed by file ID (`doc.getText(fileId)`).

### Workspace Y.Doc Hierarchy

```
Workspace
└── Y.Doc
     ├── files (Y.Map<FileMetadata>)
     │      ├── fileId_1: { id, name: "index.js", language: "javascript", parentFolderId: null }
     │      └── fileId_2: { id, name: "utils.ts", language: "typescript", parentFolderId: "folderId_1" }
     ├── folders (Y.Map<FolderMetadata>)
     │      └── folderId_1: { id, name: "src", parentFolderId: null }
     ├── metadata (Y.Map<WorkspaceMetadata>)
     │      └── workspace: { id, name: "Project", createdAt, updatedAt }
     └── textMap (doc.getText(fileId))
            ├── "fileId_1" -> Y.Text ("console.log('hello');")
            └── "fileId_2" -> Y.Text ("export function add()...")
```

### Core Workspace Class Implementation

```typescript
export class Workspace {
    private readonly doc = new Y.Doc();
    private readonly files = this.doc.getMap<FileMetadata>("files");
    private readonly folders = this.doc.getMap<FolderMetadata>("folders");
    private readonly metadata = this.doc.getMap<WorkspaceMetadata>("metadata");

    constructor(name: string) {
        const id = crypto.randomUUID();
        this.metadata.set('workspace', {
            id,
            name,
            createdAt: Date.now(),
            updatedAt: Date.now()
        });
    }

    createFile(fileName: string, language: string, parentFolderId: string | null) {
        const trimmedName = fileName.trim();
        if (!trimmedName) return { fileId: null, error: "File name cannot be empty" };

        for (const [_, file] of this.files) {
            if (file.name === trimmedName && parentFolderId === file.parentFolderId) {
                return { fileId: null, error: "Duplicate File" };
            }
        }

        const fileId = crypto.randomUUID();
        this.files.set(fileId, { id: fileId, name: trimmedName, language, parentFolderId });
        this.doc.getText(fileId);
        return { fileId, error: "" };
    }

    deleteFolder(folderId: string) {
        // Collect and delete all files in folder
        const filesToDelete = Array.from(this.files.entries())
            .filter(([_, f]) => f.parentFolderId === folderId)
            .map(([id]) => id);
        filesToDelete.forEach(id => this.deleteFile(id));

        // Recursively delete subfolders
        const subfoldersToDelete = Array.from(this.folders.entries())
            .filter(([_, f]) => f.parentFolderId === folderId)
            .map(([id]) => id);
        subfoldersToDelete.forEach(id => this.deleteFolder(id));

        this.folders.delete(folderId);
    }
}
```

## Key Architectural Decisions

1. **Flat Map Representation with Parent References**: Instead of storing nested tree objects inside Yjs maps, files and folders are stored flat in top-level `Y.Map` collections using explicit `parentFolderId` pointers. This simplifies CRDT operation encoding and eliminates complex tree re-parenting conflict scenarios.
2. **Dynamic `Y.Text` per File UUID**: Referencing text buffers via `doc.getText(fileId)` ties file content directly to immutable UUIDs. Renaming or moving a file leaves its text buffer intact, preventing data loss during structural edits.
3. **Descendant Cycle Prevention**: Moving a folder checks `isDescendant()` to prevent cyclic directory structures (e.g. attempting to move a folder inside one of its own descendants).
4. **Duplicate Path Validation**: File and folder creation methods check sibling names in the same parent directory to reject duplicate path creation before mutating CRDT state.

## Lessons Learned

- Flat entity maps paired with relational parent pointers are far easier to synchronize and mutate in Yjs than nested object graphs.
- Decoupling file metadata (`FileMetadata`) from text content buffers (`Y.Text`) allows fast directory indexing without loading full file contents into UI lists.

## Next Steps

- Refactor Socket.IO connection event handling into modular socket handlers.
- Create a client-side `workspaceEvents` API layer for sending structured file system mutations.
- Build recursive frontend sidebar tree rendering (`WorkspaceTreeNode`) and extension-based language auto-detection.
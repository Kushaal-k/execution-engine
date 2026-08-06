# 014 - Hierarchical Workspace Tree & Sidebar Tree View

## Problem

CRDT workspace state stores files and folders as flat `Y.Map` collections indexed by UUIDs. Rendering flat lists in the user interface fails to convey nested directory structures, makes navigation confusing, and complicates creating or moving files into deep subfolders. Additionally, creating files required manually specifying language modes rather than inferring them from file extensions.

## Goal

1. Implement a client-side tree construction utility (`frontend/src/utils/workspaceTree.ts`) that transforms flat metadata maps into nested tree nodes.
2. Build a recursive React component (`WorkspaceTreeNode.tsx`) for rendering nested directory hierarchies, handling expand/collapse states, active file highlighting, file creation inputs, inline renaming, and item deletion.
3. Add automatic language detection based on file extension (`utils/languageDetector.ts`) and duplicate name validation.

## Architecture & Implementation

### Tree Construction Utility (`workspaceTree.ts`)

`createTree` converts flat arrays of `FileMetadata` and `FolderMetadata` into a hierarchical `TreeNode` array:

```typescript
export interface TreeNode {
    id: string;
    name: string;
    type: "file" | "folder";
    children?: TreeNode[];
}

export function createTree({ files, folders }: ITreeNode): TreeNode[] {
    const folderMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Map folder entries
    for (const folder of folders) {
        folderMap.set(folder.id, {
            id: folder.id,
            name: folder.name,
            type: "folder",
            children: []
        });
    }

    // Link subfolders to parent folders
    for (const folder of folders) {
        const node = folderMap.get(folder.id)!;
        if (folder.parentFolderId && folderMap.has(folder.parentFolderId)) {
            folderMap.get(folder.parentFolderId)!.children!.push(node);
        } else {
            rootNodes.push(node);
        }
    }

    // Link files to parent folders or root
    for (const file of files) {
        const node: TreeNode = { id: file.id, name: file.name, type: "file" };
        if (file.parentFolderId && folderMap.has(file.parentFolderId)) {
            folderMap.get(file.parentFolderId)!.children!.push(node);
        } else {
            rootNodes.push(node);
        }
    }

    // Sort folders above files alphabetically
    const compareNodes = (a: TreeNode, b: TreeNode) => {
        if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
        return a.name.localeCompare(b.name);
    };

    folderMap.forEach(folder => folder.children?.sort(compareNodes));
    rootNodes.sort(compareNodes);

    return rootNodes;
}
```

### Recursive Node Component (`WorkspaceTreeNode.tsx`)

`WorkspaceTreeNode` recursively renders directory trees:
- Folders toggle open/closed state.
- Selecting a file updates active editor tab.
- Hover action buttons allow creating new subfiles or subfolders inside target directories.
- Double-clicking or clicking edit triggers inline input fields for renaming.
- Deleting items sends confirmation socket events to backend workspace handlers.

### Extension-Based Language Detection (`languageDetector.ts`)

When users type file names like `main.cpp` or `index.ts`, `detectLanguage` automatically infers Monaco syntax highlighting modes:

```typescript
export function detectLanguage(fileName?: string, fallback = "javascript"): string {
    if (!fileName) return fallback;
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "py": return "python";
        case "cpp": case "c": case "hpp": case "h": return "cpp";
        case "js": case "jsx": return "javascript";
        case "ts": case "tsx": return "typescript";
        case "json": return "json";
        case "html": return "html";
        case "css": return "css";
        case "md": return "markdown";
        default: return fallback;
    }
}
```

### Duplicate Validation

Both client-side creation forms and server-side `Workspace` methods enforce uniqueness for sibling entries in the same parent directory, preventing path collisions and UI rendering glitches.

## Key Improvements & Benefits

- **Intuitive IDE Layout**: Users navigate projects using familiar tree views with nested folder indentations and file icons.
- **Deterministic Tree Sorting**: Directories always appear above files, with alphabetical sorting applied at every folder level.
- **Automated Language Configuration**: Creating files auto-sets editor syntax modes based on extensions without manual dropdown selections.

## Lessons Learned

- Converting flat entity lists into nested trees on the client keeps Yjs storage simple while giving UI views complete rendering flexibility.
- Recursive component rendering paired with strict key props ensures React efficiently updates modified tree sub-branches without full sidebar re-renders.

## Next Steps

- Implement interactive STDIN code execution support.
- Fix user presence thrashing during username edits and persist assigned cursor colors.
- Complete minimal IDE UI redesign.

/**
 * Workspace & File System Tree Metadata Types
 * Shared between Server Room Manager and Frontend Explorer Component
 */

export interface FileMetadata {
    id: string;
    name: string;
    parentFolderId: string | null;
    language: string;
}

export interface FolderMetadata {
    id: string;
    name: string;
    parentFolderId: string | null;
}

export interface WorkspaceMetadata {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
}

export interface WorkspaceSnapshot {
    state: Uint8Array;
    files: FileMetadata[];
    folders: FolderMetadata[];
    metadata: WorkspaceMetadata;
}

export interface WorkspaceFilePayload {
  path: string;
  content: string;
}

export interface IWorkspaceExecutionRequest {
  workspaceId: string;
  entrypoint: string; // e.g. "src/index.js" (usually the activeFile's resolved path)
  language: "javascript" | "python" | "cpp";
  files: WorkspaceFilePayload[];
  stdin?: string;
}

export interface IWorkspaceFsEvent {
  type: "add" | "change" | "unlink";
  path: string;
  content?: string;
}


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

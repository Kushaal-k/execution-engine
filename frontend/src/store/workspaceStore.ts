import { create } from "zustand";
import * as Y from "yjs";
import type { FileMetadata, FolderMetadata, WorkspaceMetadata } from "@execution-engine/shared";
import { workspaceEvents } from "../api/workspaceEvents";

interface WorkspaceState {
  files: FileMetadata[];
  folders: FolderMetadata[];
  workspaceMetadata?: WorkspaceMetadata;
  activeFileId: string | null;
  openFileIds: string[];
  doc: Y.Doc;
  roomId: string;

  setWorkspace: (files: FileMetadata[], folders: FolderMetadata[], metadata?: WorkspaceMetadata) => void;
  setActiveFile: (fileId: string | null) => void;
  openFile: (fileId: string) => void;
  closeFile: (fileId: string) => void;

  createFile: (name: string, language: string, parentFolderId?: string | null) => void;
  renameFile: (fileId: string, newName: string) => void;
  deleteFile: (fileId: string) => void;
  createFolder: (name: string, parentFolderId?: string | null) => void;
  renameFolder: (folderId: string, newName: string) => void;
  deleteFolder: (folderId: string) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  files: [],
  folders: [],
  workspaceMetadata: undefined,
  activeFileId: null,
  openFileIds: [],
  doc: new Y.Doc(),
  roomId: "room-1",

  setWorkspace: (files, folders, metadata) => {
    const state = get();
    let nextActive = state.activeFileId;
    const nextOpen = state.openFileIds.filter(id => files.some(f => f.id === id));

    // If active file no longer exists or none selected, pick the first available file
    if ((!nextActive || !files.some(f => f.id === nextActive)) && files.length > 0) {
      nextActive = files[0].id;
      if (!nextOpen.includes(nextActive)) {
        nextOpen.push(nextActive);
      }
    }

    set({
      files,
      folders,
      workspaceMetadata: metadata ?? state.workspaceMetadata,
      activeFileId: nextActive,
      openFileIds: nextOpen,
    });
  },

  setActiveFile: (fileId) => {
    if (!fileId) {
      set({ activeFileId: null });
      return;
    }
    const { openFileIds } = get();
    set({
      activeFileId: fileId,
      openFileIds: openFileIds.includes(fileId) ? openFileIds : [...openFileIds, fileId],
    });
  },

  openFile: (fileId) => {
    const { openFileIds } = get();
    set({
      activeFileId: fileId,
      openFileIds: openFileIds.includes(fileId) ? openFileIds : [...openFileIds, fileId],
    });
  },

  closeFile: (fileId) => {
    const { openFileIds, activeFileId } = get();
    const nextOpen = openFileIds.filter((id) => id !== fileId);
    let nextActive = activeFileId;

    if (activeFileId === fileId) {
      nextActive = nextOpen.length > 0 ? nextOpen[nextOpen.length - 1] : null;
    }

    set({
      openFileIds: nextOpen,
      activeFileId: nextActive,
    });
  },

  createFile: (name, language, parentFolderId = null) => {
    workspaceEvents.createFile(name, language, parentFolderId);
  },

  renameFile: (fileId, newName) => {
    workspaceEvents.renameFile(fileId, newName);
  },

  deleteFile: (fileId) => {
    const { closeFile } = get();
    closeFile(fileId);
    workspaceEvents.deleteFile(fileId);
  },

  createFolder: (name, parentFolderId = null) => {
    workspaceEvents.createFolder(name, parentFolderId);
  },

  renameFolder: (folderId, newName) => {
    workspaceEvents.renameFolder(folderId, newName);
  },

  deleteFolder: (folderId) => {
    workspaceEvents.deleteFolder(folderId);
  },
}));

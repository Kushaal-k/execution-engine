import { collabSocket } from "./socket";

export const workspaceEvents = {
  // File CRUD
  createFile: (name: string, language: string, parentFolderId: string | null = null) =>
    collabSocket.emit("create-file", name, language, parentFolderId),
  renameFile: (fileId: string, newName: string) =>
    collabSocket.emit("rename-file", fileId, newName),
  deleteFile: (fileId: string) =>
    collabSocket.emit("delete-file", fileId),

  // Folder CRUD
  createFolder: (name: string, parentFolderId: string | null = null) =>
    collabSocket.emit("create-folder", name, parentFolderId),
  renameFolder: (folderId: string, newName: string) =>
    collabSocket.emit("rename-folder", folderId, newName),
  deleteFolder: (folderId: string) =>
    collabSocket.emit("delete-folder", folderId),
};

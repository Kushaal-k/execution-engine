import { socket2 } from "./socket";

export const workspaceEvents = {
  // File CRUD
  createFile: (name: string, language: string, parentFolderId: string | null = null) =>
    socket2.emit("create-file", name, language, parentFolderId),
  renameFile: (fileId: string, newName: string) =>
    socket2.emit("rename-file", fileId, newName),
  deleteFile: (fileId: string) =>
    socket2.emit("delete-file", fileId),

  // Folder CRUD
  createFolder: (name: string, parentFolderId: string | null = null) =>
    socket2.emit("create-folder", name, parentFolderId),
  renameFolder: (folderId: string, newName: string) =>
    socket2.emit("rename-folder", folderId, newName),
  deleteFolder: (folderId: string) =>
    socket2.emit("delete-folder", folderId),
};

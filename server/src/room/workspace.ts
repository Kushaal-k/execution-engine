import * as Y from "yjs";
import type { 
    FileMetadata,
    FolderMetadata,
    WorkspaceMetadata,
    WorkspaceSnapshot 
} from "../types/types.js";
 
export class Workspace {

    private readonly doc = new Y.Doc();

    private readonly files = 
        this.doc.getMap<FileMetadata>("files");

    private readonly folders = 
        this.doc.getMap<FolderMetadata>("folders");

    private readonly metadata = 
        this.doc.getMap<WorkspaceMetadata>("metadata");

    constructor(name: string) {
        const id = crypto.randomUUID();

        this.metadata.set('workspace', {
            id,
            name,
            createdAt: Date.now(),
            updatedAt: Date.now()
        })

        //??: TEMPORARY FILE CREATION
           this.createFile(
                "index.js",
                "javascript",
                null
            );
           this.createFile(
                "new.js",
                "javascript",
                null
            );
        //TODO: Refresh updatedAt in future updates
    }
    
    getFiles(): FileMetadata[] {
        return Array.from(this.files.values());
    }

    getFolders(): FolderMetadata[] {
        return Array.from(this.folders.values());
    }

    getMetadata(): WorkspaceMetadata {
        return this.metadata.get("workspace")!;
    }

    //TODO: Add File system validation - duplicate, and folder inside folder
    createFile(fileName: string, language: string, parentFolderId: string | null) {
        const fileId = crypto.randomUUID();

        const fileData = {
            id: fileId,
            name: fileName,
            language,
            parentFolderId
        }

        this.files.set(fileId, fileData);
        this.doc.getText(fileId);

        return fileId;
    }

    deleteFile(fileId: string) {
        this.files.delete(fileId);
        const ytext = this.doc.getText(fileId);

        // TODO: Investigate lifecycle of unused Y.Text shared types.
        ytext.delete(0, ytext.length);
    }

    renameFile(fileId: string, newFileName: string) {
        const file = this.files.get(fileId)!;

        this.files.set(fileId, {
            ...file,
            name: newFileName
        })        
    }

    moveFile(fileId: string, newParentFolderId: string) {
        const file = this.files.get(fileId)!;

        this.files.set(fileId, {
            ...file,
            parentFolderId: newParentFolderId
        })
    }

    getFile(fileId: string) {
        return this.files.get(fileId);
    }

    getText(fileId: string) {
        return this.doc.getText(fileId);
    }

    createFolder(folderName: string, parentFolderId: string | null) {
        const folderId = crypto.randomUUID();

        const folderData = {
            id: folderId,
            name: folderName,
            parentFolderId
        }

        this.folders.set(folderId, folderData);

        return folderId;
    }
    // TODO: Below Folder APIs won't work right - Fix in future
    deleteFolder(folderId: string) {
        this.folders.delete(folderId);
    }

    renameFolder(folderId: string, newName: string) {
        const folder = this.folders.get(folderId)!;

        this.folders.set(folderId, {
            ...folder,
            name: newName
        })
    }

    moveFolder(folderId: string, newParentFolderId: string) {
        const folder = this.folders.get(folderId)!;

        this.folders.set(folderId, {
            ...folder,
            parentFolderId: newParentFolderId 
        })
    }

    getFolder(folderId: string) {
        return this.folders.get(folderId);
    }

    getSnapshot(): WorkspaceSnapshot {
        return {
            state: this.encodeState(),
            files: this.getFiles(),
            folders: this.getFolders(),
            metadata: this.getMetadata()
        }
    }

    applyUpdate(update: Uint8Array) {
        Y.applyUpdate(this.doc, update);
    }

    encodeState(): Uint8Array {
        return Y.encodeStateAsUpdate(this.doc);
    }
};
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

    private isDescendant(candidateParent: string | null, childFolderId: string) {
        let currentParentId = this.folders.get(childFolderId)?.parentFolderId || null;
        
        while(currentParentId) {
            if(currentParentId === candidateParent) return true;

            currentParentId = this.folders.get(currentParentId)?.parentFolderId || null;
        }

        return false;
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
        const trimmedName = fileName.trim();

        if(!trimmedName) {
            return {
                fileId: null,
                error: "File name cannot be empty"
            }
        }

        for(const [fileId, file] of this.files) {
            if(file.name === trimmedName && parentFolderId === file.parentFolderId) {
                return {
                    fileId: null,
                    error: "Duplicate File"
                };
            }
        }

        const fileId = crypto.randomUUID();

        const fileData = {
            id: fileId,
            name: trimmedName,
            language,
            parentFolderId
        }

        this.files.set(fileId, fileData);
        this.doc.getText(fileId);

        return {
            fileId,
            error: ""
        };
    }

    deleteFile(fileId: string) {
        this.files.delete(fileId);
        const ytext = this.doc.getText(fileId);

        // TODO: Investigate lifecycle of unused Y.Text shared types.
        ytext.delete(0, ytext.length);
    }

    renameFile(fileId: string, newFileName: string): boolean {
        const trimmed = newFileName.trim();
        const file = this.files.get(fileId);
        
        if(!trimmed || !file) return false;

        for (const [id, f] of this.files) {
            if (id !== fileId && f.name === trimmed && f.parentFolderId === file.parentFolderId) {
                return false;
            }
        }

        this.files.set(fileId, {
            ...file,
            name: trimmed
        });        
        return true;
    }

    moveFile(fileId: string, newParentFolderId: string | null) {
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
        const trimmedName = folderName.trim();

        if(!trimmedName) {
            return {
                folderId: null,
                error: "Folder name cannot be empty"
            }
        }

        for(const [folderId, folder] of this.folders) {
            if(folder.name === trimmedName && parentFolderId === folder.parentFolderId) {
                return {
                    folderId: null,
                    error: "Duplicate Folder"
                };
            }
        }

        const folderId = crypto.randomUUID();

        const folderData = {
            id: folderId,
            name: trimmedName,
            parentFolderId
        }

        this.folders.set(folderId, folderData);

        return {
            folderId,
            error: ""
        };
    }

    deleteFolder(folderId: string) {

        const filesToDelete: string[] = [];

        for (const [fileId, file] of this.files.entries()) {
            if (file.parentFolderId === folderId) {
                filesToDelete.push(fileId);
            }
        }

        filesToDelete.forEach(id => this.deleteFile(id));

        const subfoldersToDelete: string[] = [];

        for (const [childFolderId, folder] of this.folders.entries()) {
            if (folder.parentFolderId === folderId) {
                subfoldersToDelete.push(childFolderId);
            }
        }

        subfoldersToDelete.forEach(id => this.deleteFolder(id));

        this.folders.delete(folderId);
    }

    renameFolder(folderId: string, newFolderName: string): boolean {
        const trimmedName = newFolderName.trim();
        const folder = this.folders.get(folderId);

        if(!trimmedName || !folder) return false;

        for (const [id, f] of this.folders) {
            if (id !== folderId && f.name === trimmedName && f.parentFolderId === folder.parentFolderId) {
                return false;
            }
        }

        this.folders.set(folderId, {
            ...folder,
            name: trimmedName
        });

        return true;
    }

    moveFolder(folderId: string, newParentFolderId: string | null) {
        if (!this.folders.has(folderId)) return false;

        const folder = this.folders.get(folderId)!;

        if(folderId === newParentFolderId) return false;
        if(newParentFolderId !== null && !this.folders.has(newParentFolderId)) {
            return false;
        }

        if(newParentFolderId !== null && this.isDescendant(folderId, newParentFolderId)) {
            return false;
        }

        this.folders.set(folderId, {
            ...folder,
            parentFolderId: newParentFolderId 
        })

        return true;
    }

    findFileByPath(relPath: string): FileMetadata | undefined {
        const normalized = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
        const segments = normalized.split("/");
        const fileName = segments.pop();
        if (!fileName) return undefined;

        let currentParentId: string | null = null;
        for (const folderName of segments) {
            const folder = Array.from(this.folders.values()).find(
                f => f.name === folderName && f.parentFolderId === currentParentId
            );
            if (!folder) return undefined;
            currentParentId = folder.id;
        }

        return Array.from(this.files.values()).find(
            f => f.name === fileName && f.parentFolderId === currentParentId
        );
    }

    createFileByPath(relPath: string, content: string = "", language?: string) {
        const normalized = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
        const segments = normalized.split("/");
        const fileName = segments.pop();
        if (!fileName) return null;

        let currentParentId: string | null = null;
        for (const folderName of segments) {
            let folder = Array.from(this.folders.values()).find(
                f => f.name === folderName && f.parentFolderId === currentParentId
            );
            if (!folder) {
                const folderId = crypto.randomUUID();
                folder = {
                    id: folderId,
                    name: folderName,
                    parentFolderId: currentParentId
                };
                this.folders.set(folderId, folder);
            }
            currentParentId = folder.id;
        }

        const existingFile = Array.from(this.files.values()).find(
            f => f.name === fileName && f.parentFolderId === currentParentId
        );

        if (existingFile) {
            if (content) {
                const ytext = this.doc.getText(existingFile.id);
                if (ytext.toString() !== content) {
                    ytext.delete(0, ytext.length);
                    ytext.insert(0, content);
                }
            }
            return existingFile.id;
        }

        const fileId = crypto.randomUUID();
        const fileData: FileMetadata = {
            id: fileId,
            name: fileName,
            language: language || detectLanguage(fileName),
            parentFolderId: currentParentId
        };

        this.files.set(fileId, fileData);
        const ytext = this.doc.getText(fileId);
        if (content) {
            ytext.insert(0, content);
        }

        return fileId;
    }

    updateFileByPath(relPath: string, content: string): boolean {
        const file = this.findFileByPath(relPath);
        if (!file) {
            this.createFileByPath(relPath, content);
            return true;
        }

        const ytext = this.doc.getText(file.id);
        if (ytext.toString() !== content) {
            ytext.delete(0, ytext.length);
            ytext.insert(0, content);
        }
        return true;
    }

    deleteFileByPath(relPath: string): boolean {
        const file = this.findFileByPath(relPath);
        if (!file) return false;
        this.deleteFile(file.id);
        return true;
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

export function detectLanguage(fileName: string): string {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "js": case "jsx": case "mjs": case "cjs": return "javascript";
        case "ts": case "tsx": return "typescript";
        case "py": return "python";
        case "cpp": case "cc": case "cxx": case "h": case "hpp": return "cpp";
        case "json": return "json";
        case "html": return "html";
        case "css": return "css";
        case "md": return "markdown";
        default: return "plaintext";
    }
}
import { useEffect, useMemo, useState } from "react";
import * as Y from "yjs";
import { socket2 } from "../api/socket";
import type { FolderMetadata, FileMetadata, WorkspaceSnapshot, WorkspaceMetadata } from "@execution-engine/shared";

export function useYjsSync(roomId: string, username: string) {
    const doc = useMemo(() => new Y.Doc(), []);
    const [ files, setFiles ] = useState<FileMetadata[]>([]);
    const [ folders, setFolders ] = useState<FolderMetadata[]>([]);
    const [ workspaceMetadata, setWorkspaceMetadata ] = useState<WorkspaceMetadata>();

    useEffect(() => {
        socket2.emit("join-room", roomId, username);

        socket2.on('sync', (workspaceSnapshot: WorkspaceSnapshot) => {
            const update = new Uint8Array(workspaceSnapshot.state);

            setFiles(workspaceSnapshot.files);
            setFolders(workspaceSnapshot.folders);
            setWorkspaceMetadata(workspaceSnapshot.metadata);
            
            Y.applyUpdate(doc, update);
        })
        
        socket2.on('update', (state) => {
            const update = new Uint8Array(state);
            Y.applyUpdate(doc, update);
        })

        const handleUpdate = (update: Uint8Array) => socket2.emit("update", update);
        doc.on("update", handleUpdate);
        
        return () => {
            doc.off("update", handleUpdate);
            socket2.off("sync");
            socket2.off("update");
        }
    }, [doc, roomId, username])
    
    return { doc, files, folders, workspaceMetadata };
}
import { useEffect, useEffectEvent, useMemo } from "react";
import * as Y from "yjs";
import { socket2 } from "../api/socket";

export function useYjsSync(roomId: string, username: string) {
    const doc = useMemo(() => new Y.Doc(), []);
    const ytext = useMemo(() => doc.getText("main"), [doc]);

    useEffect(() => {
        socket2.emit("join-room", roomId, username);

        socket2.on('sync', (state) => {
            const update = new Uint8Array(state);
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
    
    return { doc, ytext };
}
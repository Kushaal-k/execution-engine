import { useEffect, useState } from "react";
import type { MutableRefObject } from "react";
import * as monaco from "monaco-editor";
import { socket2 } from "../api/socket";
import type { PresenceUpdate } from "@execution-engine/shared";
import { createRemoteDecoration, removeUserStyles } from "../utils/monacoDecorations";

export function useRemotePresence(
    editor: monaco.editor.IStandaloneCodeEditor | null,
    decorationsRef: MutableRefObject<Map<string, monaco.editor.IEditorDecorationsCollection>>,
) {
    const [ activeUsers, setActiveUsers ] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        if(!editor) return;

        const handlePresence = (update: PresenceUpdate) => {
            if(update.userId == socket2.id) return;

            setActiveUsers(prev => {
                const next = new Map(prev);
                next.set(update.userId, update.user.username || "Anonymous");
                return next;
            })

            let collection = decorationsRef.current.get(update.userId);
            if(!collection) {
                collection = editor.createDecorationsCollection();
                decorationsRef.current.set(update.userId, collection);
            }

            collection.set(createRemoteDecoration(update));
        };

        const handleUserLeft = (userId: string) => {
            const collection = decorationsRef.current.get(userId);
            if(collection) {
                collection.clear();
                decorationsRef.current.delete(userId);
            }

            setActiveUsers(prev => {
                const next = new Map(prev);
                next.delete(userId);
                return next;
            });

            removeUserStyles(userId);
        }

        socket2.on("presence-update", handlePresence);
        socket2.on("user-left", handleUserLeft);

        return () => {
            socket2.off("presence-update", handlePresence);
            socket2.off("user-left", handleUserLeft);
        }
    }, [editor, decorationsRef])

    return { activeUsers };
}
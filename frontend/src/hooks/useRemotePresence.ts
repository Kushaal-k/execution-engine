import { useEffect } from "react";
import type { MutableRefObject } from "react";
import * as monaco from "monaco-editor";
import { collabSocket } from "../api/socket";
import type { PresenceUpdate } from "@execution-engine/shared";
import { createRemoteDecoration, removeUserStyles } from "../utils/monacoDecorations";
import { useUserStore } from "../store/userStore";

export function useRemotePresence(
  editor: monaco.editor.IStandaloneCodeEditor | null,
  decorationsRef: MutableRefObject<Map<string, monaco.editor.IEditorDecorationsCollection>>
) {
  const activeUsers = useUserStore((s) => s.activeUsers);
  const setUserPresence = useUserStore((s) => s.setUserPresence);
  const removeUserPresence = useUserStore((s) => s.removeUserPresence);

  useEffect(() => {
    if (!editor || !decorationsRef.current) return;

    const handlePresence = (update: PresenceUpdate) => {
      if (!update || !update.userId || update.userId === collabSocket.id) return;

      const userName = update.user?.username || "Anonymous";
      setUserPresence(update.userId, userName);

      if (!update.presence) return;

      let collection = decorationsRef.current.get(update.userId);
      if (!collection) {
        collection = editor.createDecorationsCollection();
        decorationsRef.current.set(update.userId, collection);
      }

      try {
        collection.set(createRemoteDecoration(update));
      } catch (err) {
        console.warn("Failed to render remote decoration:", err);
      }
    };

    const handleUserLeft = (userId: string) => {
      if (!userId) return;
      const collection = decorationsRef.current.get(userId);
      if (collection) {
        collection.clear();
        decorationsRef.current.delete(userId);
      }

      removeUserPresence(userId);
      removeUserStyles(userId);
    };

    collabSocket.on("presence-update", handlePresence);
    collabSocket.on("user-left", handleUserLeft);

    return () => {
      collabSocket.off("presence-update", handlePresence);
      collabSocket.off("user-left", handleUserLeft);
    };
  }, [editor, decorationsRef, setUserPresence, removeUserPresence]);

  return { activeUsers };
}
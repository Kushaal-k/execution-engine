import { useEffect } from "react";
import * as Y from "yjs";
import { collabSocket } from "../api/socket";
import type { WorkspaceSnapshot } from "@execution-engine/shared";
import { useWorkspaceStore } from "../store/workspaceStore";
import { useUserStore } from "../store/userStore";

export function useYjsSync() {
  const doc = useWorkspaceStore((s) => s.doc);
  const roomId = useWorkspaceStore((s) => s.roomId);
  const setWorkspace = useWorkspaceStore((s) => s.setWorkspace);
  const username = useUserStore((s) => s.username);

  useEffect(() => {
    collabSocket.emit("join-room", roomId, username);

    const handleSync = (workspaceSnapshot: WorkspaceSnapshot) => {
      const update = new Uint8Array(workspaceSnapshot.state);
      setWorkspace(workspaceSnapshot.files, workspaceSnapshot.folders, workspaceSnapshot.metadata);
      Y.applyUpdate(doc, update);
    };

    const handleRemoteUpdate = (state: Uint8Array | ArrayBuffer) => {
      const update = state instanceof Uint8Array ? state : new Uint8Array(state);
      Y.applyUpdate(doc, update);
    };

    collabSocket.on("sync", handleSync);
    collabSocket.on("update", handleRemoteUpdate);

    const handleUpdate = (update: Uint8Array) => {
      collabSocket.emit("update", update);
    };
    doc.on("update", handleUpdate);

    return () => {
      doc.off("update", handleUpdate);
      collabSocket.off("sync", handleSync);
      collabSocket.off("update", handleRemoteUpdate);
    };
  }, [doc, roomId, username, setWorkspace]);
}

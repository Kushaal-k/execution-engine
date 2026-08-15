import { create } from "zustand";
import { terminalEvents } from "../api/terminalEvents";
import { getWorkspaceFilesPayload, useWorkspaceStore } from "./workspaceStore";

export interface TerminalSession {
  id: string;
  name: string;
  language: string;
}

interface TerminalState {
  terminals: TerminalSession[];
  activeTerminalId: string | null;

  createTerminal: (workspaceId: string, language: string, customName?: string) => string;
  openTerminal: (workspaceId: string, language: string, customName?: string) => string;
  closeTerminal: (terminalId: string) => void;
  destroyTerminal: (terminalId?: string) => void;
  setActiveTerminal: (terminalId: string) => void;
  sendInput: (input: string, terminalId?: string) => void;
  syncWorkspace: (workspaceId: string) => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  terminals: [],
  activeTerminalId: null,

  createTerminal: (workspaceId, language, customName) => {
    const id = crypto.randomUUID();
    const count = get().terminals.length + 1;
    const name = customName || `Terminal ${count}`;
    const newSession: TerminalSession = { id, name, language: language.toLowerCase() };

    terminalEvents.openTerminal(workspaceId, id, language.toLowerCase());

    // Sync all workspace files into the container volume
    get().syncWorkspace(workspaceId);

    set((state) => ({
      terminals: [...state.terminals, newSession],
      activeTerminalId: id,
    }));
    return id;
  },

  openTerminal: (workspaceId, language, customName) => {
    return get().createTerminal(workspaceId, language, customName);
  },

  closeTerminal: (id) => {
    terminalEvents.destroyTerminal(id);
    set((state) => {
      const remaining = state.terminals.filter((t) => t.id !== id);
      let nextActive = state.activeTerminalId;
      if (state.activeTerminalId === id) {
        nextActive = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
      }
      return {
        terminals: remaining,
        activeTerminalId: nextActive,
      };
    });
  },

  destroyTerminal: (id) => {
    const targetId = id || get().activeTerminalId;
    if (targetId) {
      get().closeTerminal(targetId);
    }
  },

  setActiveTerminal: (terminalId) => {
    set({ activeTerminalId: terminalId });
  },

  sendInput: (input: string, terminalId?: string) => {
    const targetId = terminalId || get().activeTerminalId;
    if (targetId) {
      terminalEvents.sendInputTerminal(targetId, input);
    }
  },

  syncWorkspace: (workspaceId: string) => {
    try {
      const { files, folders, doc } = useWorkspaceStore.getState();
      const payload = getWorkspaceFilesPayload(files, folders, doc);
      if (payload.length > 0) {
        terminalEvents.syncWorkspaceFiles(workspaceId, payload);
      }
    } catch (err) {
      console.warn("Failed to sync workspace files to terminal:", err);
    }
  },
}));

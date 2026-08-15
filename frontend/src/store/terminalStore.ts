import { create } from "zustand";
import { terminalEvents } from "../api/terminalEvents";

interface TerminalState {
  terminalId: string | null;
  isOpen: boolean;

  setTerminalId: (id: string | null) => void;
  openTerminal: (workspaceId: string, language: string) => string;
  destroyTerminal: (terminalId?: string) => void;
  sendInput: (input: string) => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  terminalId: null,
  isOpen: false,

  setTerminalId: (terminalId) => set({ terminalId, isOpen: Boolean(terminalId) }),

  openTerminal: (workspaceId: string, language: string) => {
    const currentId = get().terminalId;
    if (currentId) {
      terminalEvents.destroyTerminal(currentId);
    }

    const newId = crypto.randomUUID();
    terminalEvents.openTerminal(workspaceId, newId, language.toLowerCase());
    set({ terminalId: newId, isOpen: true });
    return newId;
  },

  destroyTerminal: (id) => {
    const targetId = id || get().terminalId;
    if (targetId) {
      terminalEvents.destroyTerminal(targetId);
      if (targetId === get().terminalId) {
        set({ terminalId: null, isOpen: false });
      }
    }
  },

  sendInput: (input: string) => {
    const { terminalId } = get();
    if (terminalId) {
      terminalEvents.sendInputTerminal(terminalId, input);
    }
  },
}));

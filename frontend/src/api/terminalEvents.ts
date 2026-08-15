import { executionSocket } from "./socket";

export const terminalEvents = {
  openTerminal: (workspaceId: string, terminalId: string, language: string) =>
    executionSocket.emit("terminal:open", workspaceId, terminalId, language),
  sendInputTerminal: (terminalId: string, input: string) =>
    executionSocket.emit("terminal:input", terminalId, input),
  stopTerminal: (terminalId: string) =>
    executionSocket.emit("terminal:stop", terminalId),
  destroyTerminal: (terminalId: string) =>
    executionSocket.emit("terminal:destroy", terminalId),
};

export const terminalListeners = {
  onOpened: (callback: (data: { terminalId: string; message?: string }) => void) => {
    executionSocket.on("terminal:opened", callback);
    return () => executionSocket.off("terminal:opened", callback);
  },
  onError: (callback: (data: { terminalId: string; message: string }) => void) => {
    executionSocket.on("terminal:error", callback);
    return () => executionSocket.off("terminal:error", callback);
  },
  onOutput: (callback: (data: { terminalId: string; output: string }) => void) => {
    executionSocket.on("terminal:output", callback);
    return () => executionSocket.off("terminal:output", callback);
  },
};
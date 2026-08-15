import { useEffect, useRef } from "react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { useExecutionStore } from "../store/executionStore";
import { useTerminalStore } from "../store/terminalStore";
import TerminalInstance from "./TerminalInstance";

export function TerminalView() {
  const roomId = useWorkspaceStore((s) => s.roomId);
  const language = useExecutionStore((s) => s.language);

  const terminals = useTerminalStore((s) => s.terminals);
  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId);
  const createTerminal = useTerminalStore((s) => s.createTerminal);

  const hasInitializedRef = useRef(false);

  // Auto-create initial terminal only on first mount
  useEffect(() => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      if (terminals.length === 0) {
        createTerminal(roomId, language);
      }
    }
  }, [roomId, language, createTerminal, terminals.length]);

  const handleNewTerminal = () => {
    createTerminal(roomId, language);
  };

  return (
    <div className="h-full w-full bg-zinc-950 p-2 relative overflow-hidden select-text">
      {terminals.length === 0 ? (
        <div className="h-full w-full flex flex-col items-center justify-center text-zinc-600 text-xs font-mono select-none">
          <span>No active terminal sessions</span>
          <button
            onClick={handleNewTerminal}
            className="mt-2 px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] border border-zinc-800 transition-colors cursor-pointer"
          >
            + Open Terminal
          </button>
        </div>
      ) : (
        terminals.map((term) => (
          <TerminalInstance
            key={term.id}
            terminalId={term.id}
            isActive={term.id === activeTerminalId}
          />
        ))
      )}
    </div>
  );
}

export default TerminalView;
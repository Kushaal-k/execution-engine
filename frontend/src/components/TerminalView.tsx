import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { terminalListeners } from "../api/terminalEvents";
import { useWorkspaceStore } from "../store/workspaceStore";
import { useExecutionStore } from "../store/executionStore";
import { useTerminalStore } from "../store/terminalStore";
import "@xterm/xterm/css/xterm.css";

export function TerminalView() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const roomId = useWorkspaceStore((s) => s.roomId);
  const language = useExecutionStore((s) => s.language);
  const openTerminal = useTerminalStore((s) => s.openTerminal);
  const sendInput = useTerminalStore((s) => s.sendInput);

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      theme: {
        background: "#09090b",
        foreground: "#f4f4f5",
        cursor: "#a1a1aa",
        selectionBackground: "#3f3f4680",
        black: "#18181b",
        red: "#f43f5e",
        green: "#10b981",
        yellow: "#f59e0b",
        blue: "#3b82f6",
        magenta: "#d946ef",
        cyan: "#06b6d4",
        white: "#f4f4f5",
      },
      fontSize: 12,
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      cursorBlink: true,
      convertEol: true,
    });

    terminal.open(terminalRef.current);
    terminal.focus();

    // Open terminal session via terminalStore
    const activeTerminalId = openTerminal(roomId, language.toLowerCase());

    const onDataDispose = terminal.onData((input) => {
      sendInput(input);
    });

    const unsubscribeOutput = terminalListeners.onOutput((data) => {
      if (data.terminalId === activeTerminalId) {
        terminal.write(data.output);
      }
    });

    const unsubscribeError = terminalListeners.onError((data) => {
      if (data.terminalId === activeTerminalId) {
        terminal.write(`\r\n\x1b[31m[Error]: ${data.message}\x1b[0m\r\n`);
      }
    });

    return () => {
      onDataDispose.dispose();
      unsubscribeOutput();
      unsubscribeError();
      terminal.dispose();
    };
  }, [roomId, language, openTerminal, sendInput]);

  return (
    <div className="h-full w-full bg-zinc-950 p-2 overflow-hidden">
      <div ref={terminalRef} tabIndex={0} className="h-full w-full outline-none" />
    </div>
  );
}

export default TerminalView;
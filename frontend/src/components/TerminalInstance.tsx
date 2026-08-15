import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { terminalListeners } from "../api/terminalEvents";
import { useTerminalStore } from "../store/terminalStore";
import "@xterm/xterm/css/xterm.css";

interface TerminalInstanceProps {
  terminalId: string;
  isActive: boolean;
}

export function TerminalInstance({ terminalId, isActive }: TerminalInstanceProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
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
      scrollback: 5000,
      smoothScrollDuration: 100,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    fitAddonRef.current = fitAddon;

    terminal.open(terminalRef.current);
    fitAddon.fit();

    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
      } catch {
        // Suppress fit errors during element teardown
      }
    });
    resizeObserver.observe(terminalRef.current);

    const onDataDispose = terminal.onData((input) => {
      sendInput(input, terminalId);
    });

    const unsubscribeOutput = terminalListeners.onOutput((data) => {
      if (data.terminalId === terminalId) {
        terminal.write(data.output);
      }
    });

    const unsubscribeError = terminalListeners.onError((data) => {
      if (data.terminalId === terminalId) {
        terminal.write(`\r\n\x1b[31m[Error]: ${data.message}\x1b[0m\r\n`);
      }
    });

    return () => {
      resizeObserver.disconnect();
      onDataDispose.dispose();
      unsubscribeOutput();
      unsubscribeError();
      terminal.dispose();
    };
  }, [terminalId, sendInput]);

  useEffect(() => {
    if (isActive && fitAddonRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
        } catch {
          // Ignore fit errors
        }
      }, 50);
    }
  }, [isActive]);

  return (
    <div
      ref={terminalRef}
      tabIndex={0}
      className={`h-full w-full outline-none ${isActive ? "block" : "hidden"}`}
    />
  );
}

export default TerminalInstance;

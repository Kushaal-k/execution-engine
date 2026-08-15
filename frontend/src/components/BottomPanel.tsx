import { useState } from "react";
import { Terminal, Copy, Check, Trash2, ChevronDown, ChevronUp, FileInput, PlaySquare } from "lucide-react";
import { useExecutionStore } from "../store/executionStore";
import { useTerminalStore } from "../store/terminalStore";
import TerminalView from "./TerminalView";

export function BottomPanel() {
  const status = useExecutionStore((s) => s.status);
  const response = useExecutionStore((s) => s.response);
  const error = useExecutionStore((s) => s.error);
  const stdin = useExecutionStore((s) => s.stdin);
  const setStdin = useExecutionStore((s) => s.setStdin);
  const clearOutput = useExecutionStore((s) => s.clearOutput);
  const activeTab = useExecutionStore((s) => s.activePanelTab);
  const setActiveTab = useExecutionStore((s) => s.setActivePanelTab);
  const isCollapsed = useExecutionStore((s) => s.isPanelCollapsed);
  const setIsCollapsed = useExecutionStore((s) => s.setIsPanelCollapsed);

  const destroyTerminal = useTerminalStore((s) => s.destroyTerminal);

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = (response?.stdout || "") + (error ? `\nError:\n${error}` : "");
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatMemory = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (isCollapsed) {
    return (
      <div className="w-full bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between px-3 py-1.5 text-xs text-zinc-400 font-mono select-none shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-medium text-zinc-300">Console & Terminal</span>
          {status && status !== "Idle" && (
            <span className="text-[10px] text-zinc-500">• {status}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors p-1 cursor-pointer text-[11px]"
        >
          <span>Expand</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-950 border-t border-zinc-800/80 flex flex-col shrink-0 text-zinc-300 select-none h-56 transition-all duration-150">
      {/* Header / Tabs */}
      <div className="flex items-center justify-between px-3 py-1 bg-zinc-950 border-b border-zinc-800/60 font-mono text-[11px]">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("output")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === "output"
                ? "bg-zinc-900 text-zinc-100 font-medium"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <PlaySquare className="w-3.5 h-3.5" />
            <span>Output</span>
            {error && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("terminal")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === "terminal"
                ? "bg-zinc-900 text-zinc-100 font-medium"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stdin")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              activeTab === "stdin"
                ? "bg-zinc-900 text-zinc-100 font-medium"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FileInput className="w-3.5 h-3.5" />
            <span>Stdin</span>
            {stdin.trim() && <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />}
          </button>
        </div>

        {/* Metrics & Actions */}
        <div className="flex items-center gap-3 text-zinc-500">
          {response?.executionTime !== undefined && response?.executionTime !== null && (
            <span>{response.executionTime}ms</span>
          )}

          {response?.memoryUsed !== undefined &&
            response?.memoryUsed !== null &&
            formatMemory(response.memoryUsed) && (
              <span>{formatMemory(response.memoryUsed)}</span>
            )}

          {response?.exitCode !== undefined && response?.exitCode !== null && (
            <span className={response.exitCode === 0 ? "text-emerald-400" : "text-rose-400"}>
              exit: {response.exitCode}
            </span>
          )}

          <div className="flex items-center gap-1 pl-1 border-l border-zinc-800">
            {activeTab === "output" && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Copy Output"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={clearOutput}
                  className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                  title="Clear Output"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {activeTab === "terminal" && (
              <button
                type="button"
                onClick={() => destroyTerminal()}
                className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                title="Kill Terminal Session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Minimize Panel"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden font-mono text-xs select-text relative">
        {activeTab === "output" && (
          <div className="h-full overflow-y-auto p-3 flex flex-col justify-start">
            {error && error.trim() && (
              <div className="mb-2 text-rose-400 leading-relaxed font-mono">
                {error}
              </div>
            )}
            {response?.exitCode !== undefined && response?.exitCode !== null ? (
              <pre className="text-zinc-200 whitespace-pre-wrap leading-relaxed font-mono">
                {response.stdout || ""}
              </pre>
            ) : !error ? (
              <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-mono select-none">
                Run code (Ctrl+Enter) to inspect terminal output
              </div>
            ) : null}
          </div>
        )}

        {activeTab === "terminal" && <TerminalView />}

        {activeTab === "stdin" && (
          <div className="h-full p-2">
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter standard input..."
              className="w-full h-full p-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-600 font-mono text-xs focus:outline-none focus:border-zinc-700 resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default BottomPanel;

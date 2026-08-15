import { useState } from "react";
import { Terminal, Copy, Check, Trash2, ChevronDown, ChevronUp, FileInput, PlaySquare, Plus, X } from "lucide-react";
import { useExecutionStore } from "../store/executionStore";
import { useWorkspaceStore } from "../store/workspaceStore";
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

  const roomId = useWorkspaceStore((s) => s.roomId);
  const language = useExecutionStore((s) => s.language);

  const terminals = useTerminalStore((s) => s.terminals);
  const activeTerminalId = useTerminalStore((s) => s.activeTerminalId);
  const createTerminal = useTerminalStore((s) => s.createTerminal);
  const closeTerminal = useTerminalStore((s) => s.closeTerminal);
  const setActiveTerminal = useTerminalStore((s) => s.setActiveTerminal);
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

  const handleTabClick = (tab: "output" | "terminal" | "stdin") => {
    setActiveTab(tab);
    if (isCollapsed) {
      setIsCollapsed(false);
    }
    if (tab === "terminal") {
      useTerminalStore.getState().syncWorkspace(roomId);
    }
  };

  const handleDestroyTerminal = () => {
    destroyTerminal();
  };

  return (
    <div
      className={`w-full bg-zinc-950 border-t border-zinc-800/80 flex flex-col shrink-0 text-zinc-300 select-none transition-all duration-150 ${
        isCollapsed ? "h-8" : "h-56"
      }`}
    >
      {/* Unified Single Header Bar */}
      <div className="flex items-center justify-between px-3 h-8 bg-zinc-950 border-b border-zinc-800/60 font-mono text-[11px] shrink-0">
        <div className="flex items-center gap-1">
          {/* Output Tab */}
          <button
            type="button"
            onClick={() => handleTabClick("output")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              !isCollapsed && activeTab === "output"
                ? "bg-zinc-900 text-zinc-100 font-medium"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <PlaySquare className="w-3.5 h-3.5" />
            <span>Output</span>
            {error && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
          </button>

          {/* Stdin Tab */}
          <button
            type="button"
            onClick={() => handleTabClick("stdin")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              !isCollapsed && activeTab === "stdin"
                ? "bg-zinc-900 text-zinc-100 font-medium"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FileInput className="w-3.5 h-3.5" />
            <span>Stdin</span>
            {stdin.trim() && <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />}
          </button>

          {/* Terminal Tab (At the End) */}
          <button
            type="button"
            onClick={() => handleTabClick("terminal")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
              !isCollapsed && activeTab === "terminal"
                ? "bg-zinc-900 text-zinc-100 font-medium"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          {/* Inline Terminal Sessions (merged into same row) */}
          {!isCollapsed && activeTab === "terminal" && terminals.length > 0 && (
            <div className="flex items-center gap-1 pl-1.5 ml-0.5 border-l border-zinc-800">
              {terminals.map((term) => {
                const isSelected = term.id === activeTerminalId;
                return (
                  <div
                    key={term.id}
                    onClick={() => setActiveTerminal(term.id)}
                    className={`group flex items-center gap-1 px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-zinc-800 text-zinc-100 font-medium"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                    }`}
                  >
                    <span>{term.name}</span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTerminal(term.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 ml-0.5"
                      title="Close Session"
                    >
                      <X className="w-2.5 h-2.5" />
                    </span>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => createTerminal(roomId, language)}
                className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900 rounded transition-colors cursor-pointer"
                title="New Terminal Session"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {/* Metrics & Actions */}
        <div className="flex items-center gap-3 text-zinc-500">
          {status && status !== "Idle" && (
            <span className="text-[10px] text-zinc-400 font-sans">• {status}</span>
          )}

          {!isCollapsed && response?.executionTime !== undefined && response?.executionTime !== null && (
            <span>{response.executionTime}ms</span>
          )}

          {!isCollapsed && response?.memoryUsed !== undefined &&
            response?.memoryUsed !== null &&
            formatMemory(response.memoryUsed) && (
              <span>{formatMemory(response.memoryUsed)}</span>
            )}

          {!isCollapsed && response?.exitCode !== undefined && response?.exitCode !== null && (
            <span className={response.exitCode === 0 ? "text-emerald-400" : "text-rose-400"}>
              exit: {response.exitCode}
            </span>
          )}

          <div className="flex items-center gap-1 pl-1 border-l border-zinc-800">
            {!isCollapsed && activeTab === "output" && (
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

            {!isCollapsed && activeTab === "terminal" && (
              <button
                type="button"
                onClick={handleDestroyTerminal}
                className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                title="Kill Active Terminal Session"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
              title={isCollapsed ? "Expand Panel" : "Minimize Panel"}
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area - Kept mounted in DOM so terminal sessions/buffers are preserved */}
      <div className={`flex-1 min-h-0 overflow-hidden font-mono text-xs select-text relative ${isCollapsed ? "hidden" : "block"}`}>
        {/* Output Panel */}
        <div className={`h-full overflow-y-auto p-3 flex-col justify-start ${activeTab === "output" ? "flex" : "hidden"}`}>
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

        {/* Terminal Panel - Always mounted so xterm session & subprocesses persist */}
        <div className={`h-full w-full ${activeTab === "terminal" ? "block" : "hidden"}`}>
          <TerminalView />
        </div>

        {/* Stdin Panel */}
        <div className={`h-full p-2 ${activeTab === "stdin" ? "block" : "hidden"}`}>
          <textarea
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter standard input..."
            className="w-full h-full p-2 bg-zinc-900 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-600 font-mono text-xs focus:outline-none focus:border-zinc-700 resize-none"
          />
        </div>
      </div>
    </div>
  );
}

export default BottomPanel;

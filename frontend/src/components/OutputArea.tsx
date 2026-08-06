import { useEffect, useState } from "react";
import { Terminal, Copy, Check, Trash2, ChevronDown, ChevronUp, FileInput } from "lucide-react";
import type { Status } from "./InputCode";

interface OutputAreaProps {
    stdout: string | null;
    error?: string | null;
    executionTime?: number | null;
    memoryUsed?: number | null;
    exitCode?: number | null;
    status?: Status;
    stdin: string;
    setStdin: (val: string) => void;
    onClearOutput?: () => void;
}

function OutputArea({
    stdout,
    error,
    executionTime,
    memoryUsed,
    exitCode,
    status,
    stdin,
    setStdin,
    onClearOutput
}: OutputAreaProps) {
    const [activeTab, setActiveTab] = useState<"output" | "stdin">("output");
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        const textToCopy = (stdout || "") + (error ? `\nError:\n${error}` : "");
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

    useEffect(() => {
        if (stdout != null || error) {
            setActiveTab("output");
        }
    }, [stdout, error]);

    if (isCollapsed) {
        return (
            <div className="w-full bg-zinc-950 border-t border-zinc-800/80 flex items-center justify-between px-3 py-1 text-xs text-zinc-400 font-mono select-none shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Console Terminal</span>
                    {status && (
                        <span className="text-[10px] text-zinc-500">
                            • {status}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="flex items-center gap-1 hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                >
                    <span>Expand</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="w-full bg-zinc-950 border-t border-zinc-800/80 flex flex-col shrink-0 text-zinc-300 select-none">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between px-3 py-1 bg-zinc-950 border-b border-zinc-800/60 font-mono text-[11px]">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setActiveTab("output")}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors cursor-pointer ${
                            activeTab === "output"
                                ? "bg-zinc-900 text-zinc-100 font-medium"
                                : "text-zinc-500 hover:text-zinc-300"
                        }`}
                    >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Output</span>
                        {error && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                    </button>

                    <button
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
                    {executionTime !== undefined && executionTime !== null && (
                        <span>{executionTime}ms</span>
                    )}

                    {memoryUsed !== undefined && memoryUsed !== null && formatMemory(memoryUsed) && (
                        <span>{formatMemory(memoryUsed)}</span>
                    )}

                    {exitCode !== undefined && exitCode !== null && (
                        <span className={exitCode === 0 ? "text-emerald-400" : "text-rose-400"}>
                            exit: {exitCode}
                        </span>
                    )}

                    <div className="flex items-center gap-1 pl-1 border-l border-zinc-800">
                        {activeTab === "output" && (
                            <>
                                <button
                                    onClick={handleCopy}
                                    className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                                    title="Copy Output"
                                >
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>

                                {onClearOutput && (
                                    <button
                                        onClick={onClearOutput}
                                        className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                                        title="Clear Output"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </>
                        )}

                        <button
                            onClick={() => setIsCollapsed(true)}
                            className="p-1 text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
                            title="Minimize"
                        >
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="h-40 overflow-y-auto p-3 font-mono text-xs select-text">
                {activeTab === "output" && (
                    <div className="h-full flex flex-col justify-start">
                        {error && error.trim() && (
                            <div className="mb-2 text-rose-400 leading-relaxed font-mono">
                                {error}
                            </div>
                        )}
                        {exitCode !== undefined && exitCode !== null ? (
                            <pre className="text-zinc-200 whitespace-pre-wrap leading-relaxed font-mono">
                                {stdout || ""}
                            </pre>
                        ) : !error ? (
                            <div className="h-full flex items-center justify-center text-zinc-600 text-xs font-mono select-none">
                                Run code to inspect terminal output
                            </div>
                        ) : null}
                    </div>
                )}

                {activeTab === "stdin" && (
                    <div className="h-full flex flex-col">
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

export default OutputArea;
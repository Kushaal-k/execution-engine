import type { Dispatch, SetStateAction, MouseEventHandler } from "react";
import { Play, Loader2, User } from "lucide-react";
import { useEffect, useState } from "react";

interface ITopBarProps {
    loading: boolean;
    handleSubmit: MouseEventHandler<HTMLButtonElement>;
    status: string;
    username: string;
    setUsername: Dispatch<SetStateAction<string>>;
}

function Topbar({ handleSubmit, loading, status, username, setUsername }: ITopBarProps) {

    const [localName, setLocalName] = useState<string>("");

    useEffect(() => {
        setLocalName(username);
    }, [username]);

    const renderStatusDot = () => {
        const lowerStatus = status?.toLowerCase() || "";
        if (loading || lowerStatus === "pending" || lowerStatus === "queued") {
            return (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span>{status || "Running"}</span>  
                </div>
            );
        }
        if (lowerStatus === "failed") {
            return (
                <div className="flex items-center gap-1.5 text-[11px] text-rose-400 font-mono">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Failed</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Ready</span>
            </div>
        );
    };

    return (
        <header className="z-30 top-0 w-full h-11 bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between px-4 shrink-0 select-none">
            {/* Branding & Status */}
            <div className="flex items-center gap-3">
                <span className="font-semibold text-xs text-zinc-100 tracking-tight">
                    Tessera Collaborative Engine
                </span>

                <div className="h-3 w-px bg-zinc-800" />

                {renderStatusDot()}
            </div>

            {/* Actions & Profile */}
            <div className="flex items-center gap-3">
                {/* Username Input */}
                <div className="relative flex items-center">
                    <User className="absolute left-2 text-zinc-500 w-3.5 h-3.5 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Username"
                        value={localName}
                        onChange={(e) => setLocalName(e.target.value)}
                        onBlur={() => setUsername(localName)}
                        onKeyDown={(e) => {
                            if(e.key === "Enter" || e.key === "Escape"){
                                setUsername(localName);
                                e.currentTarget.blur();
                            }
                        }}
                        disabled={username.length > 0}
                        className="pl-7 pr-2.5 py-1 text-xs bg-zinc-900 border border-zinc-800 rounded text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors w-32 disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-zinc-950"
                    />
                </div>

                {/* Minimal Run Button */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-zinc-100 hover:bg-zinc-700 text-zinc-950 font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    {loading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{loading ? "Running" : "Run"}</span>
                    <kbd className="hidden sm:inline-block pl-1 text-[10px] text-zinc-500 font-mono">
                        Ctrl+↵
                    </kbd>
                </button>
            </div>
        </header>
    );
}

export default Topbar;
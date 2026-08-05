import { FileCode, FilePlus, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { FileMetadata, FolderMetadata, WorkspaceMetadata } from "@execution-engine/shared";
import { socket2 } from "../api/socket";
import type { KeyboardEvent } from "react";

interface SidebarProps {
    files?: FileMetadata[];
    folders?: FolderMetadata[];
    workspaceMetadata?: WorkspaceMetadata;
    currentFileId?: string;
    onSelectFile?: (fileId: string) => void;
}

export function Sidebar({ files = [], currentFileId, onSelectFile }: SidebarProps) {
    const [open, setOpen] = useState(true);
    const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string>("");

    const inputRef = useRef<HTMLInputElement>(null);

    const displayFiles = Array.isArray(files) ? files.filter(f => f && f.id) : [];

    const createFile = (fileName: string, language: string) => {
        socket2.emit('create-file', fileName, language, null);
    };

    const fileCreation = () => {
        if (!fileName?.trim()) return;

        const extension = fileName.split(".").pop();

        let detectedLanguage = "javascript";

        if (extension === "cpp" || extension === "c") {
            detectedLanguage = "cpp";
        } else if (extension === "js" || extension === "ts" || extension === "jsx" || extension === "tsx") {
            detectedLanguage = "javascript";
        } else if (extension === "py") {
            detectedLanguage = "python";
        }

        createFile(fileName, detectedLanguage);

        setIsCreatingFile(false);
        setFileName("");
    };

    const cancelFileCreation = () => {
        setIsCreatingFile(false);
        setFileName("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            fileCreation();
        }
        if (e.key === "Escape") {
            cancelFileCreation();
        }
    };

    useEffect(() => {
        if (isCreatingFile) {
            inputRef.current?.focus();
        }
    }, [isCreatingFile]);

    return (
        <aside className={`h-full bg-zinc-950 text-zinc-300 border-r border-zinc-800/80 flex flex-col shrink-0 select-none transition-all duration-200 ${open ? "w-52" : "w-10 items-center py-2.5 text-zinc-500"}`}>
            {!open ? (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpen(true);
                    }}
                    className="p-1.5 hover:bg-zinc-900 hover:text-zinc-200 rounded transition-colors cursor-pointer"
                    title="Open Sidebar"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            ) : (
                <>
                    {/* Header */}
                    <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider border-b border-zinc-800/80 flex justify-between items-center text-zinc-500">
                        <span>Explorer</span>
                        <div className="flex items-center gap-0.5">
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setFileName("");
                                    setIsCreatingFile(true);
                                }}
                                className="hover:text-zinc-100 hover:bg-zinc-900 p-1 rounded transition-colors cursor-pointer"
                                title="New File"
                            >
                                <FilePlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsCreatingFile(false);
                                    setOpen(false);
                                }}
                                className="hover:text-zinc-100 hover:bg-zinc-900 p-1 rounded transition-colors cursor-pointer"
                                title="Collapse"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* File List */}
                    <div className="flex-1 overflow-y-auto p-1.5">
                        <ul className="flex flex-col gap-0.5 text-xs font-mono">
                            {isCreatingFile && (
                                <li className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-700">
                                    <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <input
                                        ref={inputRef}
                                        className="bg-transparent text-zinc-100 outline-none text-xs w-full"
                                        placeholder="filename.js"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onBlur={() => {
                                            if (fileName.trim()) {
                                                fileCreation();
                                            } else {
                                                cancelFileCreation();
                                            }
                                        }}
                                    />
                                </li>
                            )}
                            {displayFiles.map((file) => {
                                const isActive = file.id === currentFileId;
                                return (
                                    <li
                                        key={file.id}
                                        onClick={() => onSelectFile && onSelectFile(file.id)}
                                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                                            isActive
                                                ? "bg-zinc-800 text-zinc-100 font-medium"
                                                : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
                                        }`}
                                    >
                                        <FileCode className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                        <span className="truncate text-xs">{file.name || "Untitled"}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </>
            )}
        </aside>
    );
}

export default Sidebar;
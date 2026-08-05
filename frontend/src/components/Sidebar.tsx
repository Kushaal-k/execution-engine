import { FileCode, FilePlus, ChevronLeft, ChevronRight, Trash2, FolderPlus, Folder } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import type { FileMetadata, FolderMetadata, WorkspaceMetadata } from "@execution-engine/shared";
import type { KeyboardEvent } from "react";
import { detectLanguage } from "../utils/languageDetector";
import { workspaceEvents } from "../api/workspaceEvents";
import { createTree } from "../utils/workspaceTree";
import WorkspaceTreeNode from "./WorkspaceTreeNode";

interface SidebarProps {
    files?: FileMetadata[];
    folders?: FolderMetadata[];
    workspaceMetadata?: WorkspaceMetadata;
    currentFileId: string;
    onSelectFile?: (fileId: string) => void;
}

export function Sidebar({ files = [], folders = [], currentFileId, onSelectFile }: SidebarProps) {
    const [open, setOpen] = useState(true);
    const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string>("");
    const [folderName, setFolderName] = useState<string>("");

    const inputRef = useRef<HTMLInputElement>(null);

    const tree = createTree({ files, folders });

    const handleFileCreate = () => {
        const trimmed = fileName.trim();
        if (trimmed) {
            workspaceEvents.createFile(trimmed, detectLanguage(trimmed), null);
        }
        setIsCreatingFile(false);
        setFileName("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleFileCreate();
        if (e.key === "Escape") {
            setIsCreatingFile(false);
            setFileName("");
        }
    };

    const handleFolderCreate = () => {
        const trimmed = folderName.trim();
        if (trimmed) {
            workspaceEvents.createFolder(trimmed);
        }

        setIsCreatingFolder(false);
        setFolderName("");
    }

    const handleKeyDownFolder = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") handleFolderCreate();
        if (e.key === "Escape") {
            setIsCreatingFolder(false);
            setFolderName("");
        }
    }

    useEffect(() => {
        if (isCreatingFile || isCreatingFolder) {
            inputRef.current?.focus();
        }
    }, [isCreatingFile, isCreatingFolder]);

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
                                    setIsCreatingFolder(true);
                                    setFolderName("");
                                }}
                                className="hover:text-zinc-100 hover:bg-zinc-900 p-1 rounded transition-colors cursor-pointer"
                                title="New Folder"
                            >
                                <FolderPlus className="w-3.5 h-3.5" />
                            </button>
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
                            {tree.map((node) => (
                                <WorkspaceTreeNode 
                                    key={node.id}
                                    node={node}
                                    currentFileId={currentFileId}
                                    onSelectFile={onSelectFile}
                                />
                            ))}
                            {isCreatingFolder && (
                                <li className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-700">
                                    <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <input
                                        ref={inputRef}
                                        className="bg-transparent text-zinc-100 outline-none text-xs w-full"
                                        value={folderName}
                                        onChange={(e) => setFolderName(e.target.value)}
                                        onKeyDown={handleKeyDownFolder}
                                        onBlur={handleFolderCreate}
                                    />
                                </li>
                            )}
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
                                        onBlur={handleFileCreate}
                                    />
                                </li>
                            )}
                        </ul>
                    </div>
                </>
            )}
        </aside>
    );
}

export default Sidebar;
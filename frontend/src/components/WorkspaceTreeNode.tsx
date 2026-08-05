import { ChevronDown, ChevronRight, FileCode, FilePlus, Folder, FolderPlus, Trash2 } from "lucide-react";
import { type TreeNode } from "../utils/workspaceTree";
import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import { workspaceEvents } from "../api/workspaceEvents";
import { detectLanguage } from "../utils/languageDetector";

interface TreeNodeProps {
    node: TreeNode;
    depth?: number;
    currentFileId?: string;
    onSelectFile?: (fileId: string) => void;
}

function WorkspaceTreeNode({ node, depth = 0, currentFileId, onSelectFile }: TreeNodeProps) {
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [isRenaming, setIsRenaming] = useState<boolean>(false);
    const [tempName, setTempName] = useState<string>(node.name);
    const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string>("");
    const [folderName, setFolderName] = useState<string>("");

    const inputRef = useRef<HTMLInputElement>(null);

    const handleRenameSubmit = () => {
        const newName = tempName.trim();
        if (newName && newName !== node.name) {
            if (node.type === "file") {
                workspaceEvents.renameFile(node.id, newName);
            } else {
                workspaceEvents.renameFolder(node.id, newName);
            }
        }
        setIsRenaming(false);
    };

    if (isRenaming) {
        return (
            <li
                style={{ paddingLeft: `${depth * 12 + 10}px` }}
                className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-700"
            >
                {node.type === "file" ? (
                    <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                ) : (
                    <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                )}
                <input
                    autoFocus
                    className="bg-transparent text-zinc-100 outline-none text-xs w-full font-mono"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameSubmit();
                        if (e.key === "Escape") setIsRenaming(false);
                    }}
                    onBlur={handleRenameSubmit}
                />
            </li>
        );
    }

    const handleFileCreate = (parentFolderId: string) => {
            const trimmed = fileName.trim();
            if (trimmed) {
                workspaceEvents.createFile(trimmed, detectLanguage(trimmed), parentFolderId);
            }
            setIsCreatingFile(false);
            setFileName("");
        };
    
        const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") handleFileCreate(node.id);
            if (e.key === "Escape") {
                setIsCreatingFile(false);
                setFileName("");
            }
        };
    
        const handleFolderCreate = (parentFolderId: string) => {
            const trimmed = folderName.trim();
            if (trimmed) {
                workspaceEvents.createFolder(trimmed, parentFolderId);
            }
    
            setIsCreatingFolder(false);
            setFolderName("");
        }
    
        const handleKeyDownFolder = (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") handleFolderCreate(node.id);
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

    if (node.type === "file") {
        const isActive = node.id === currentFileId;
        return (
            <li
                onClick={() => onSelectFile?.(node.id)}
                onDoubleClick={() => {
                    setIsRenaming(true);
                    setTempName(node.name);
                }}
                style={{ paddingLeft: `${depth * 12 + 10}px` }}
                className={`group flex items-center justify-between gap-2 py-1.5 pr-2.5 rounded cursor-pointer transition-colors ${
                    isActive
                        ? "bg-zinc-800 text-zinc-100 font-medium"
                        : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
                }`}
            >
                <div className="flex items-center gap-2 truncate min-w-0">
                    <FileCode className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-zinc-300" : "text-zinc-500"}`} />
                    <span className="truncate text-xs">{node.name || "Untitled"}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        workspaceEvents.deleteFile(node.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-opacity cursor-pointer shrink-0"
                    title="Delete file"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </li>
        );
    }

    return (
        <li className="flex flex-col">
            <div
                onClick={() => setIsOpen((open) => !open)}
                onDoubleClick={() => {
                    setIsRenaming(true);
                    setTempName(node.name);
                }}
                style={{ paddingLeft: `${depth * 12 + 6}px` }}
                className="group flex items-center justify-between gap-1.5 py-1.5 pr-2.5 rounded cursor-pointer transition-colors text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
            >
                <div className="flex items-center gap-1.5 truncate min-w-0">
                    {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    )}
                    <Folder className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate text-xs font-medium text-zinc-300">{node.name || "Untitled"}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(true);
                        setIsCreatingFile(true);
                        setFileName("");
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-amber-400 p-0.5 rounded transition-opacity cursor-pointer shrink-0"
                    title="Create File"
                >
                    <FilePlus className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(true);
                        setIsCreatingFolder(true);
                        setFolderName("");
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-amber-400 p-0.5 rounded transition-opacity cursor-pointer shrink-0"
                    title="Create Folder"
                >
                    <FolderPlus className="w-3.5 h-3.5" />
                </button>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        workspaceEvents.deleteFolder(node.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-opacity cursor-pointer shrink-0"
                    title="Delete folder"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            {isCreatingFolder && (
                                <li 
                                className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-700"
                                style={{ paddingLeft: `${depth * 12 + 6}px` }}
                                >
                                    <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <input
                                        ref={inputRef}
                                        className="bg-transparent text-zinc-100 outline-none text-xs w-full"
                                        value={folderName}
                                        onChange={(e) => setFolderName(e.target.value)}
                                        onKeyDown={handleKeyDownFolder}
                                        onBlur={() => handleFolderCreate(node.id)}
                                    />
                                </li>
                            )}
                            {isCreatingFile && (
                                <li className="flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border border-zinc-700"
                                style={{ paddingLeft: `${depth * 12 + 6}px` }}
                                >
                                    <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                    <input
                                        ref={inputRef}
                                        className="bg-transparent text-zinc-100 outline-none text-xs w-full"
                                        placeholder="filename.js"
                                        value={fileName}
                                        onChange={(e) => setFileName(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        onBlur={() => handleFileCreate(node.id)}
                                    />
                                </li>
                            )}

            {isOpen && node.children && node.children.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                    {node.children.map((child) => (
                        <WorkspaceTreeNode
                            key={child.id}
                            node={child}
                            depth={depth + 1}
                            currentFileId={currentFileId}
                            onSelectFile={onSelectFile}
                        />
                    ))}
                </ul>
            )}
        </li>
    );
}

export default WorkspaceTreeNode;
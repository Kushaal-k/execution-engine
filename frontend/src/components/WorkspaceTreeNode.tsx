import { ChevronDown, ChevronRight, FileCode, FilePlus, Folder, FolderPlus, Trash2 } from "lucide-react";
import { type TreeNode } from "../utils/workspaceTree";
import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import type { FileMetadata, FolderMetadata } from "@execution-engine/shared";
import { workspaceEvents } from "../api/workspaceEvents";
import { detectLanguage } from "../utils/languageDetector";

interface TreeNodeProps {
    node: TreeNode;
    files?: FileMetadata[];
    folders?: FolderMetadata[];
    depth?: number;
    currentFileId?: string;
    onSelectFile?: (fileId: string) => void;
}

function WorkspaceTreeNode({ node, files = [], folders = [], depth = 0, currentFileId, onSelectFile }: TreeNodeProps) {
    const [isOpen, setIsOpen] = useState<boolean>(true);
    const [isRenaming, setIsRenaming] = useState<boolean>(false);
    const [tempName, setTempName] = useState<string>(node.name);
    const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
    const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
    const [fileName, setFileName] = useState<string>("");
    const [folderName, setFolderName] = useState<string>("");

    const inputRef = useRef<HTMLInputElement>(null);

    // Compute live duplicate errors from prop-drilled files/folders
    const parentId = node.type === "file" 
        ? files.find(f => f.id === node.id)?.parentFolderId ?? null
        : folders.find(f => f.id === node.id)?.parentFolderId ?? null;

    const trimmedTempName = tempName.trim();
    const isDuplicateRename = trimmedTempName.length > 0 && trimmedTempName !== node.name && (
        files.some(f => f.id !== node.id && f.parentFolderId === parentId && f.name.toLowerCase() === trimmedTempName.toLowerCase()) ||
        folders.some(f => f.id !== node.id && f.parentFolderId === parentId && f.name.toLowerCase() === trimmedTempName.toLowerCase())
    );

    const trimmedFileName = fileName.trim();
    const isDuplicateFile = trimmedFileName.length > 0 && (
        files.some(f => f.parentFolderId === node.id && f.name.toLowerCase() === trimmedFileName.toLowerCase()) ||
        folders.some(f => f.parentFolderId === node.id && f.name.toLowerCase() === trimmedFileName.toLowerCase())
    );

    const trimmedFolderName = folderName.trim();
    const isDuplicateFolder = trimmedFolderName.length > 0 && (
        files.some(f => f.parentFolderId === node.id && f.name.toLowerCase() === trimmedFolderName.toLowerCase()) ||
        folders.some(f => f.parentFolderId === node.id && f.name.toLowerCase() === trimmedFolderName.toLowerCase())
    );

    const handleRenameSubmit = () => {
        if (isDuplicateRename) return;
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

    const handleFileCreate = (parentFolderId: string) => {
        if (isDuplicateFile) return;
        const trimmed = fileName.trim();
        if (trimmed) {
            workspaceEvents.createFile(trimmed, detectLanguage(trimmed), parentFolderId);
        }
        setIsCreatingFile(false);
        setFileName("");
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (e.key === "Enter") handleFileCreate(node.id);
        if (e.key === "Escape") {
            setIsCreatingFile(false);
            setFileName("");
        }
    };

    const handleFolderCreate = (parentFolderId: string) => {
        if (isDuplicateFolder) return;
        const trimmed = folderName.trim();
        if (trimmed) {
            workspaceEvents.createFolder(trimmed, parentFolderId);
        }
        setIsCreatingFolder(false);
        setFolderName("");
    };

    const handleKeyDownFolder = (e: KeyboardEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (e.key === "Enter") handleFolderCreate(node.id);
        if (e.key === "Escape") {
            setIsCreatingFolder(false);
            setFolderName("");
        }
    };

    useEffect(() => {
        if (isCreatingFile || isCreatingFolder) {
            inputRef.current?.focus();
        }
    }, [isCreatingFile, isCreatingFolder]);

    if (isRenaming) {
        return (
            <li className="relative flex flex-col my-0.5">
                <div
                    style={{ paddingLeft: `${depth * 12 + (node.type === "file" ? 10 : 6)}px` }}
                    className={`flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border transition-colors ${
                        isDuplicateRename ? "border-rose-500 bg-rose-950/20" : "border-zinc-700"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                    onDoubleClick={(e) => e.stopPropagation()}
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
                            e.stopPropagation();
                            if (e.key === "Enter") handleRenameSubmit();
                            if (e.key === "Escape") {
                                setIsRenaming(false);
                                setTempName(node.name);
                            }
                        }}
                        onBlur={handleRenameSubmit}
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                    />
                </div>
                {isDuplicateRename && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 p-2 bg-rose-950/95 border border-rose-700/80 rounded shadow-xl text-[10px] text-rose-200 leading-tight font-sans select-none wrap-break-word">
                        A file or folder '{trimmedTempName}' already exists at this location. Please choose a different name.
                    </div>
                )}
                {node.type === "folder" && isOpen && node.children && node.children.length > 0 && (
                    <ul className="flex flex-col gap-0.5 mt-0.5">
                        {node.children.map((child) => (
                            <WorkspaceTreeNode
                                key={child.id}
                                node={child}
                                files={files}
                                folders={folders}
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

    if (node.type === "file") {
        const isActive = node.id === currentFileId;
        return (
            <li
                onClick={(e) => {
                    e.stopPropagation();
                    onSelectFile?.(node.id);
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    setTempName(node.name);
                    setIsRenaming(true);
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
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen((open) => !open);
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    setTempName(node.name);
                    setIsRenaming(true);
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
                <div>
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
            </div>

            {isCreatingFolder && (
                <div className="relative flex flex-col my-0.5">
                    <div 
                        className={`flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border transition-colors ${
                            isDuplicateFolder ? "border-rose-500 bg-rose-950/20" : "border-zinc-700"
                        }`}
                        style={{ paddingLeft: `${(depth + 1) * 12 + 6}px` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <input
                            ref={inputRef}
                            className="bg-transparent text-zinc-100 outline-none text-xs w-full font-mono"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            onKeyDown={handleKeyDownFolder}
                            onBlur={() => handleFolderCreate(node.id)}
                        />
                    </div>
                    {isDuplicateFolder && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-50 p-2 bg-rose-950/95 border border-rose-700/80 rounded shadow-xl text-[10px] text-rose-200 leading-tight font-sans select-none wrap-break-word">
                            A file or folder '{trimmedFolderName}' already exists at this location. Please choose a different name.
                        </div>
                    )}
                </div>
            )}
            {isCreatingFile && (
                <div className="relative flex flex-col my-0.5">
                    <div 
                        className={`flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border transition-colors ${
                            isDuplicateFile ? "border-rose-500 bg-rose-950/20" : "border-zinc-700"
                        }`}
                        style={{ paddingLeft: `${(depth + 1) * 12 + 6}px` }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <input
                            ref={inputRef}
                            className="bg-transparent text-zinc-100 outline-none text-xs w-full font-mono"
                            placeholder="filename.js"
                            value={fileName}
                            onChange={(e) => setFileName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={() => handleFileCreate(node.id)}
                        />
                    </div>
                    {isDuplicateFile && (
                        <div className="absolute left-0 right-0 top-full mt-1 z-50 p-2 bg-rose-950/95 border border-rose-700/80 rounded shadow-xl text-[10px] text-rose-200 leading-tight font-sans select-none wrap-break-word">
                            A file or folder '{trimmedFileName}' already exists at this location. Please choose a different name.
                        </div>
                    )}
                </div>
            )}

            {isOpen && node.children && node.children.length > 0 && (
                <ul className="flex flex-col gap-0.5">
                    {node.children.map((child) => (
                        <WorkspaceTreeNode
                            key={child.id}
                            node={child}
                            files={files}
                            folders={folders}
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
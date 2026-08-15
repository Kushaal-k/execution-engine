import { ChevronDown, ChevronRight, FileCode, FilePlus, Folder, FolderPlus, Trash2 } from "lucide-react";
import { type TreeNode } from "../utils/workspaceTree";
import { useEffect, useState, useRef } from "react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { detectLanguage } from "../utils/languageDetector";

interface TreeNodeProps {
  node: TreeNode;
  depth?: number;
}

export function WorkspaceTreeNode({ node, depth = 0 }: TreeNodeProps) {
  const files = useWorkspaceStore((s) => s.files);
  const folders = useWorkspaceStore((s) => s.folders);
  const activeFileId = useWorkspaceStore((s) => s.activeFileId);
  const openFile = useWorkspaceStore((s) => s.openFile);
  const createFile = useWorkspaceStore((s) => s.createFile);
  const deleteFile = useWorkspaceStore((s) => s.deleteFile);
  const renameFile = useWorkspaceStore((s) => s.renameFile);
  const createFolder = useWorkspaceStore((s) => s.createFolder);
  const deleteFolder = useWorkspaceStore((s) => s.deleteFolder);
  const renameFolder = useWorkspaceStore((s) => s.renameFolder);

  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isRenaming, setIsRenaming] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(node.name);
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [folderName, setFolderName] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);

  const parentId =
    node.type === "file"
      ? files.find((f) => f.id === node.id)?.parentFolderId ?? null
      : folders.find((f) => f.id === node.id)?.parentFolderId ?? null;

  const isDuplicateName = (targetName: string, targetParentId: string | null, excludeId?: string) => {
    const trimmed = targetName.trim().toLowerCase();
    if (!trimmed) return false;
    const dupFile = files.some(
      (f) => f.id !== excludeId && f.parentFolderId === targetParentId && f.name.toLowerCase() === trimmed
    );
    const dupFolder = folders.some(
      (f) => f.id !== excludeId && f.parentFolderId === targetParentId && f.name.toLowerCase() === trimmed
    );
    return dupFile || dupFolder;
  };

  const isDuplicateRename = isDuplicateName(tempName, parentId, node.id);
  const isDuplicateFile = isDuplicateName(fileName, node.id);
  const isDuplicateFolder = isDuplicateName(folderName, node.id);

  const handleRenameSubmit = () => {
    if (isDuplicateRename) return;
    const newName = tempName.trim();
    if (newName && newName !== node.name) {
      if (node.type === "file") {
        renameFile(node.id, newName);
      } else {
        renameFolder(node.id, newName);
      }
    }
    setIsRenaming(false);
  };

  const handleFileCreate = () => {
    if (isDuplicateFile) return;
    const trimmed = fileName.trim();
    if (trimmed) {
      createFile(trimmed, detectLanguage(trimmed), node.id);
    }
    setIsCreatingFile(false);
    setFileName("");
  };

  const handleFolderCreate = () => {
    if (isDuplicateFolder) return;
    const trimmed = folderName.trim();
    if (trimmed) {
      createFolder(trimmed, node.id);
    }
    setIsCreatingFolder(false);
    setFolderName("");
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
          />
        </div>
        {isDuplicateRename && (
          <div className="absolute left-0 right-0 top-full mt-1 z-50 p-2 bg-rose-950/95 border border-rose-700/80 rounded shadow-xl text-[10px] text-rose-200 leading-tight font-sans select-none">
            A file or folder '{tempName.trim()}' already exists in this folder.
          </div>
        )}
      </li>
    );
  }

  if (node.type === "file") {
    const isActive = node.id === activeFileId;
    return (
      <li
        onClick={(e) => {
          e.stopPropagation();
          openFile(node.id);
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
            deleteFile(node.id);
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
        <div className="flex items-center">
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
              deleteFolder(node.id);
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
              placeholder="folder-name"
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") handleFolderCreate();
                if (e.key === "Escape") {
                  setIsCreatingFolder(false);
                  setFolderName("");
                }
              }}
              onBlur={handleFolderCreate}
            />
          </div>
          {isDuplicateFolder && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 p-2 bg-rose-950/95 border border-rose-700/80 rounded shadow-xl text-[10px] text-rose-200 leading-tight font-sans select-none">
              A file or folder '{folderName.trim()}' already exists here.
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
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") handleFileCreate();
                if (e.key === "Escape") {
                  setIsCreatingFile(false);
                  setFileName("");
                }
              }}
              onBlur={handleFileCreate}
            />
          </div>
          {isDuplicateFile && (
            <div className="absolute left-0 right-0 top-full mt-1 z-50 p-2 bg-rose-950/95 border border-rose-700/80 rounded shadow-xl text-[10px] text-rose-200 leading-tight font-sans select-none">
              A file or folder '{fileName.trim()}' already exists here.
            </div>
          )}
        </div>
      )}

      {isOpen && node.children && node.children.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {node.children.map((child) => (
            <WorkspaceTreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default WorkspaceTreeNode;
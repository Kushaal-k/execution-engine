import { FileCode, FilePlus, ChevronLeft, ChevronRight, FolderPlus, Folder } from "lucide-react";
import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { detectLanguage } from "../utils/languageDetector";
import { createTree } from "../utils/workspaceTree";
import { useWorkspaceStore } from "../store/workspaceStore";
import WorkspaceTreeNode from "./WorkspaceTreeNode";

export function Sidebar() {
  const rawFiles = useWorkspaceStore((s) => s.files);
  const rawFolders = useWorkspaceStore((s) => s.folders);
  const createFile = useWorkspaceStore((s) => s.createFile);
  const createFolder = useWorkspaceStore((s) => s.createFolder);

  const files = Array.isArray(rawFiles) ? rawFiles.filter(Boolean) : [];
  const folders = Array.isArray(rawFolders) ? rawFolders.filter(Boolean) : [];

  const [open, setOpen] = useState(true);
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>("");
  const [folderName, setFolderName] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);

  const tree = createTree({ files, folders });

  const trimmedFileName = (fileName || "").trim().toLowerCase();
  const isDuplicateFile =
    trimmedFileName.length > 0 &&
    (files.some((f) => f && f.parentFolderId === null && (f.name || "").toLowerCase() === trimmedFileName) ||
      folders.some((f) => f && f.parentFolderId === null && (f.name || "").toLowerCase() === trimmedFileName));

  const trimmedFolderName = (folderName || "").trim().toLowerCase();
  const isDuplicateFolder =
    trimmedFolderName.length > 0 &&
    (files.some((f) => f && f.parentFolderId === null && (f.name || "").toLowerCase() === trimmedFolderName) ||
      folders.some((f) => f && f.parentFolderId === null && (f.name || "").toLowerCase() === trimmedFolderName));

  const handleFileCreate = () => {
    if (isDuplicateFile) return;
    const trimmed = (fileName || "").trim();
    if (trimmed) {
      createFile(trimmed, detectLanguage(trimmed), null);
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
    if (isDuplicateFolder) return;
    const trimmed = (folderName || "").trim();
    if (trimmed) {
      createFolder(trimmed, null);
    }
    setIsCreatingFolder(false);
    setFolderName("");
  };

  const handleKeyDownFolder = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleFolderCreate();
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

  return (
    <aside
      className={`h-full bg-zinc-950 text-zinc-300 border-r border-zinc-800/80 flex flex-col shrink-0 select-none transition-all duration-200 ${
        open ? "w-56" : "w-10 items-center py-2.5 text-zinc-500"
      }`}
    >
      {!open ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="p-1.5 hover:bg-zinc-900 hover:text-zinc-200 rounded transition-colors cursor-pointer"
          title="Open Explorer"
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
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* File Tree List */}
          <div className="flex-1 overflow-y-auto p-1.5">
            <ul className="flex flex-col gap-0.5 text-xs font-mono">
              {tree.map((node) => (
                <WorkspaceTreeNode key={node.id} node={node} />
              ))}

              {isCreatingFolder && (
                <li className="relative flex flex-col my-0.5">
                  <div
                    className={`flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border transition-colors ${
                      isDuplicateFolder ? "border-rose-500 bg-rose-950/20" : "border-zinc-700"
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <input
                      ref={inputRef}
                      className="bg-transparent text-zinc-100 outline-none text-xs w-full font-mono"
                      placeholder="folder-name"
                      value={folderName}
                      onChange={(e) => setFolderName(e.target.value)}
                      onKeyDown={handleKeyDownFolder}
                      onBlur={handleFolderCreate}
                    />
                  </div>
                  {isDuplicateFolder && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 p-2 bg-rose-950/95 border border-rose-700/80 rounded shadow-xl text-[10px] text-rose-200 leading-tight font-sans select-none">
                      A folder or file '{(folderName || "").trim()}' already exists.
                    </div>
                  )}
                </li>
              )}

              {isCreatingFile && (
                <li className="relative flex flex-col my-0.5">
                  <div
                    className={`flex items-center gap-2 px-2 py-1 rounded bg-zinc-900 border transition-colors ${
                      isDuplicateFile ? "border-rose-500 bg-rose-950/20" : "border-zinc-700"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <input
                      ref={inputRef}
                      className="bg-transparent text-zinc-100 outline-none text-xs w-full font-mono"
                      placeholder="filename.js"
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onBlur={handleFileCreate}
                    />
                  </div>
                  {isDuplicateFile && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 p-2 bg-rose-950/95 border border-rose-700/80 rounded shadow-xl text-[10px] text-rose-200 leading-tight font-sans select-none">
                      A file or folder '{(fileName || "").trim()}' already exists.
                    </div>
                  )}
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
import { FileBracesCorner, Menu, X, FilePlusCorner } from "lucide-react"
import { useState } from "react"
import type { FileMetadata, FolderMetadata, WorkspaceMetadata } from "@execution-engine/shared"

interface SidebarProps {
    files?: FileMetadata[];
    folders?: FolderMetadata[];
    workspaceMetadata?: WorkspaceMetadata;
    currentFileId?: string;
    onSelectFile?: (fileId: string) => void;
}

const DEFAULT_FILES = [
    { id: "1", name: "index.html" },
    { id: "2", name: "style.css" },
    { id: "3", name: "script.js" }
];

export function Sidebar({ files = [], folders = [], currentFileId, onSelectFile }: SidebarProps) {
    const [open, setOpen] = useState(true);

    const displayFiles = files.length > 0 ? files : DEFAULT_FILES;

    if (!open) {
        return (
            <div className="w-10 h-full bg-gray-900 border-r border-gray-700 flex flex-col items-center py-2 text-white shrink-0">
                <button onClick={() => setOpen(true)} className="p-1 hover:bg-gray-800 rounded" title="Open Sidebar">
                    <Menu height={18} width={18} />
                </button>
            </div>
        );
    }

    return (
        <div className="w-56 h-full bg-gray-900 text-white border-r border-gray-700 flex flex-col shrink-0">
            <div className="p-3 font-semibold text-xs border-b border-gray-700 uppercase flex justify-between items-center text-gray-400">
                <span>File Explorer</span>
                <div>
                    <button className="hover:text-white p-1 rounded">
                        <FilePlusCorner height={16} width={16}/>
                    </button>
                    <button onClick={() => setOpen(false)} className="hover:text-white p-1 rounded" title="Close Sidebar">
                        <X height={16} width={16} />
                    </button>
                </div>
            </div>
            <div className="p-2 border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase">
                Project
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                <ul className="flex flex-col gap-1 text-sm">
                    {displayFiles.map((file) => (
                        <li
                            key={file.id}
                            onClick={() => onSelectFile && onSelectFile(file.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors ${
                                file.id === currentFileId
                                    ? "bg-blue-600/30 text-blue-300 font-medium"
                                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                            }`}
                        >
                            <FileBracesCorner height={16} width={16} className="text-gray-400 shrink-0" />
                            <span className="truncate">{file.name}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default Sidebar;
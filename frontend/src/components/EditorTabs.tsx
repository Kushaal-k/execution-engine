import { FileCode, X } from "lucide-react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { useExecutionStore } from "../store/executionStore";

export function EditorTabs() {
  const files = useWorkspaceStore((s) => s.files);
  const openFileIds = useWorkspaceStore((s) => s.openFileIds);
  const activeFileId = useWorkspaceStore((s) => s.activeFileId);
  const setActiveFile = useWorkspaceStore((s) => s.setActiveFile);
  const closeFile = useWorkspaceStore((s) => s.closeFile);
  const language = useExecutionStore((s) => s.language);

  const openFiles = openFileIds
    .map((id) => files.find((f) => f && f.id === id))
    .filter((f): f is NonNullable<typeof f> => Boolean(f));

  return (
    <div className="flex items-center bg-zinc-950 border-b border-zinc-800/80 overflow-x-auto select-none no-scrollbar shrink-0 h-9">
      {openFiles.length === 0 ? (
        <div className="flex items-center gap-2 px-3 py-1.5 h-full text-xs font-mono border-r border-zinc-800/80 bg-zinc-900 text-zinc-100 border-t-2 border-t-emerald-500 font-medium">
          <FileCode className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
          <span className="truncate">scratchpad.{language === "python" ? "py" : language === "cpp" ? "cpp" : "js"}</span>
        </div>
      ) : (
        openFiles.map((file) => {
          const isActive = file.id === activeFileId;
          return (
            <div
              key={file.id}
              onClick={() => setActiveFile(file.id)}
              className={`group flex items-center gap-2 px-3 py-1.5 h-full text-xs font-mono border-r border-zinc-800/80 cursor-pointer transition-colors border-t-2 ${
                isActive
                  ? "bg-zinc-900 text-zinc-100 border-t-emerald-500 font-medium"
                  : "bg-zinc-950 text-zinc-400 border-t-transparent hover:bg-zinc-900/50 hover:text-zinc-200"
              }`}
            >
              <FileCode
                className={`w-3.5 h-3.5 shrink-0 ${
                  isActive ? "text-zinc-300" : "text-zinc-500 group-hover:text-zinc-400"
                }`}
              />
              <span className="truncate max-w-[140px]">{file.name}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  closeFile(file.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-zinc-800 p-0.5 rounded text-zinc-400 hover:text-zinc-200 transition-opacity ml-1"
                title="Close tab"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

export default EditorTabs;

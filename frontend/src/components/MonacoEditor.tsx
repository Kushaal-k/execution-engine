import { Editor } from "@monaco-editor/react";
import { useState, useEffect, useRef } from "react";
import { collabSocket } from "../api/socket";
import { MonacoBinding } from "y-monaco";
import * as monaco from "monaco-editor";
import { useRemotePresence } from "../hooks/useRemotePresence";
import { Users } from "lucide-react";
import { useWorkspaceStore } from "../store/workspaceStore";
import { useExecutionStore } from "../store/executionStore";
import { useUserStore } from "../store/userStore";
import { detectLanguage } from "../utils/languageDetector";

// Throttle for real-time updates for collaborative cursor or selections
const throttle = (fn: () => void, delay: number) => {
  let lastCall = 0;
  return function () {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn();
    }
  };
};

export function MonacoEditor() {
  const doc = useWorkspaceStore((s) => s.doc);
  const activeFileId = useWorkspaceStore((s) => s.activeFileId);
  const files = useWorkspaceStore((s) => s.files);

  const code = useExecutionStore((s) => s.code);
  const setCode = useExecutionStore((s) => s.setCode);
  const language = useExecutionStore((s) => s.language);
  const setLanguage = useExecutionStore((s) => s.setLanguage);

  const username = useUserStore((s) => s.username);

  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorationRef = useRef(new Map<string, monaco.editor.IEditorDecorationsCollection>());

  const { activeUsers } = useRemotePresence(editor, decorationRef);

  const activeFile = files.find((f) => f && f.id === activeFileId);
  const ytext = activeFileId ? doc.getText(activeFileId) : null;

  // Sync detected language when active file changes
  useEffect(() => {
    if (activeFile) {
      const detected = detectLanguage(activeFile.name, activeFile.language);
      setLanguage(detected);
    }
  }, [activeFile, setLanguage]);

  // Sync Yjs text with execution code state when using collaborative file
  useEffect(() => {
    if (!ytext) return;

    setCode(ytext.toString());

    const handleYtextChange = () => {
      setCode(ytext.toString());
    };

    ytext.observe(handleYtextChange);

    return () => {
      ytext.unobserve(handleYtextChange);
    };
  }, [ytext, setCode]);

  // Setup Monaco Yjs binding and presence tracking when ytext is active
  useEffect(() => {
    if (!editor || !ytext) return;

    const model = editor.getModel();
    if (!model) return;

    const binding = new MonacoBinding(ytext, model, new Set([editor]), null);

    const sendPresence = throttle(() => {
      const position = editor.getPosition();
      const selection = editor.getSelection();

      collabSocket.emit("presence-update", {
        cursor: position ?? undefined,
        selection: selection
          ? {
              startLineNumber: selection.startLineNumber,
              startColumn: selection.startColumn,
              endLineNumber: selection.endLineNumber,
              endColumn: selection.endColumn,
            }
          : undefined,
        activeFile: activeFileId || undefined,
      });
    }, 50);

    const cursorListener = editor.onDidChangeCursorSelection(sendPresence);

    return () => {
      cursorListener.dispose();
      binding.destroy();
    };
  }, [editor, ytext, activeFileId]);

  return (
    <div className="h-full w-full flex flex-col z-0 bg-zinc-950">
      {/* Active Collaborators Bar */}
      <div className="px-3 flex items-center gap-3 py-1 bg-zinc-950 text-[11px] border-b border-zinc-800/80 shrink-0 select-none text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium">
          <Users className="w-3.5 h-3.5 text-zinc-500" />
          <span>Collaborators ({activeUsers.size + 1}):</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {username || "Anonymous"} (You)
          </span>
          {Array.from(activeUsers.entries()).map(([userId, uname]) => (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px]"
              key={userId}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              {uname}
            </span>
          ))}
        </div>
      </div>

      {/* Editor Component */}
      <div className="flex-1 w-full min-h-0">
        <Editor
          height="100%"
          language={language.toLowerCase()}
          value={ytext ? undefined : code}
          defaultValue="// Write your code here"
          onChange={(val) => {
            if (!ytext) {
              setCode(val || "");
            }
          }}
          theme="vs-dark"
          options={{
            automaticLayout: true,
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            wordBasedSuggestions: "currentDocument",
            acceptSuggestionOnEnter: "on",
            tabCompletion: "on",
            fontSize: 13,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            minimap: { enabled: false },
            padding: { top: 8 },
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            renderLineHighlight: "line",
            scrollBeyondLastLine: false,
          }}
          onMount={(editorInstance) => setEditor(editorInstance)}
        />
      </div>
    </div>
  );
}

export default MonacoEditor;

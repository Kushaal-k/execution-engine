import { Editor } from "@monaco-editor/react";
import { useState, useEffect, useRef } from "react";
import { socket2 } from '../api/socket';
import { MonacoBinding } from "y-monaco";
import * as monaco from "monaco-editor";
import { useRemotePresence } from "../hooks/useRemotePresence";
import type { Doc } from "yjs";
import { Users } from "lucide-react";

interface MonacoEditorProps {
  language: string;
  username: string;
  roomId?: string;
  currentFileId: string;
  doc: Doc;
  setCode?: (code: string) => void;
}

//Throttle for real-time updates for collaborative cursor or selections
const throttle = (fn: () => void, delay: number) => {
  let lastCall = 0;

  return function () {
    const now = Date.now();

    if (now - lastCall >= delay) {
      lastCall = now;
      fn();
    }
  }
}

function MonacoEditor({
  language,
  username,
  currentFileId,
  doc,
  setCode,
}: MonacoEditorProps) {

  //Editor ref after mount
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  //Map of decorations for each user
  const decorationRef = useRef(new Map<string, monaco.editor.IEditorDecorationsCollection>());
  //Current username ref
  const usernameRef = useRef(username);

  //Update username on every change
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  
  const { activeUsers } = useRemotePresence(editor, decorationRef);
  const ytext = currentFileId ? doc.getText(currentFileId) : null;

  // Sync Yjs text with parent code state
  useEffect(() => {
    if(!ytext || !setCode) return;

    setCode(ytext.toString());

    const handleYtextChange = () => {
      setCode(ytext.toString());
    };

    ytext.observe(handleYtextChange);

    return () => {
      ytext.unobserve(handleYtextChange);
    };
  }, [ytext, setCode]);

  useEffect(() => {
    if(!editor || !ytext) return;
    
    const model = editor.getModel();
    if(!model) return;

    const binding = new MonacoBinding(ytext, model, new Set([editor]), null);
    
    console.log("Binding created");

    const sendPresence = throttle(() => {
      const position = editor.getPosition();
      const selection = editor.getSelection();

      socket2.emit("presence-update", {
        cursor: position ?? undefined,
        selection: selection
          ? {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn,
          }
          : undefined,
        activeFile: currentFileId
      });
    }, 50);

    editor.onDidChangeCursorSelection(sendPresence);

    return () => {
      binding.destroy();
      socket2.off("presence-update", sendPresence);
    }
  }, [editor, ytext])

  return (
    <div className="h-full w-full flex flex-col z-0 bg-zinc-950">
      {/* Active Users Bar */}
      <div className="px-3 flex items-center gap-3 py-1.5 bg-zinc-950 text-[11px] border-b border-zinc-800/80 shrink-0 select-none text-zinc-400">
        <div className="flex items-center gap-1.5 font-medium">
          <Users className="w-3.5 h-3.5 text-zinc-500" />
          <span>Collaborators ({activeUsers.size + 1}):</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {username || "Anonymous"} (You)
          </span>
          {Array.from(activeUsers.values()).map((uname, index) => (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px]" key={index}>
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
          defaultValue="// Write your code here"
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


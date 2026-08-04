import { Editor } from "@monaco-editor/react";
import { useState, useEffect, useRef } from "react";
import { socket2 } from '../api/socket';
import { MonacoBinding } from "y-monaco";
import * as monaco from "monaco-editor";
import { useYjsSync } from "../hooks/userYjsSync";
import { useRemotePresence } from "../hooks/useRemotePresence";

interface MonacoEditorProps {
  language: string;
  username: string;
  roomId?: string;
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
  roomId = "room-1"
}: MonacoEditorProps) {

  //Editor ref after mount
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);
  //Map of decorations for each user
  const decorationRef = useRef(new Map<string, monaco.editor.IEditorDecorationsCollection>());
  //Current username ref
  const usernameRef = useRef(username);

  const [currentFileId, setCurrentFileId] = useState<string>();

  //Update username on every change
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  const { doc, files, folders, workspaceMetadata } = useYjsSync(roomId, username);
  const { activeUsers } = useRemotePresence(editor, decorationRef);
  const ytext = currentFileId ? doc.getText(currentFileId) : null;

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

  useEffect(() => {
    if(!currentFileId && files.length > 0) {
      console.log(files);
      setCurrentFileId(files[0].id);
    }
  }, [currentFileId, files])

  return (
    <div className="h-full w-full z-0">
      {/* Active Users Badge */}
      <div className="pl-10 flex items-center gap-2 p-2 bg-gray-800 text-xs text-gray-300 border-b border-gray-700">
        <span className="font-semibold text-gray-400">Connected Users ({activeUsers.size + 1}) :</span>
        <span className="px-2 py-0.5 rounded bg-blue-600 font-semibold text-white">
          {username || "Anonymous"} (You)
        </span>
          {Array.from(activeUsers.values()).map((username, index) => (
            <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-200" key={index}>{username}</span>
          ))}
      </div>
      {/* Editor Component */}
      <Editor
        height="81.9vh"
        language={language.toLowerCase()}
        defaultValue="console.log('Hello World')"
        theme="vs-dark"
        options={{
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          wordBasedSuggestions: "currentDocument",
          acceptSuggestionOnEnter: "on",
          tabCompletion: "on",
        }}
        onMount={(editorInstance) => setEditor(editorInstance)}
      />
    </div>  
  );
}

export default MonacoEditor;

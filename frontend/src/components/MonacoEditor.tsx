import { Editor } from "@monaco-editor/react";
import { useEffect } from "react";
import {socket2} from '../api/socket';
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import type {
  PresenceUpdate,
} from "../../../server/src/types/types.ts"

interface MonacoEditorProps {
  language: string;
}

const doc = new Y.Doc();

const ytext = doc.getText("main");

function MonacoEditor({
  language,
}: MonacoEditorProps) {

  useEffect(() => {
    socket2.emit('join-room', 'room-1', 'Kushaal');

    socket2.on('sync', (state) => {
      const update = new Uint8Array(state);
      Y.applyUpdate(doc, update);
    })

    socket2.on('update', (state) => {
      const update = new Uint8Array(state);
      Y.applyUpdate(doc, update);
    })

    socket2.on('presence-update', (presenceUpdate: PresenceUpdate) => {
      //TODO: Add visuals to show remote cursors
      //TODO: Show users connected as well
      console.log(presenceUpdate.userId);
      console.log(presenceUpdate.presence.cursor?.column);
    })

    doc.on('update', (update) => {
      socket2.emit('update', update);
    })

  }, [])

  return (
    <div className="h-full w-full z-0"> 
      <Editor
        height="80vh"
        language={language.toLowerCase()}
        defaultValue="console.log('Hello World')"
        theme="vs-dark"
        options={{
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              wordBasedSuggestions: "currentDocument",
              acceptSuggestionOnEnter: "on",
              tabCompletion: "on",
          }
        }
        onMount={(editor) => {

          //TODO: Move to dedicated function 
          const model = editor.getModel();
          if(!model) return;

          const monacoBinding = new MonacoBinding(ytext, model, new Set([editor]), null);

          editor.onDidChangeCursorSelection(() => {
            //TODO: Add throttle of 50ms - to save up requests
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
                activeFile: "main.cpp",
            });
          })
          
          monacoBinding.destroy();
        }}
      >
      </Editor>
    </div>
    
  );
}

export default MonacoEditor;

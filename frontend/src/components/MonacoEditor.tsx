import { Editor } from "@monaco-editor/react";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import {socket2} from '../api/socket';
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco"

interface MonacoEditorProps {
  language: string;
  code: string;
  setCode: Dispatch<SetStateAction<string>>;
}

const doc = new Y.Doc();

const ytext = doc.getText("main");

function MonacoEditor({
  language,
  code,
  setCode,
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
        onMount={(editor, monaco) => {
          const model = editor.getModel();

          if(!model) return;

          const monacoBinding = new MonacoBinding(ytext, model, new Set([editor]), null);
        }}
      >
      </Editor>
    </div>
    
  );
}

export default MonacoEditor;

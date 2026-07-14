import { Editor } from "@monaco-editor/react";
import { useEffect, type Dispatch, type SetStateAction } from "react";
import socket from '../api/socket';
import * as Y from "yjs";

interface MonacoEditorProps {
  language: string;
  code: string;
  setCode: Dispatch<SetStateAction<string>>;
}

const doc = new Y.Doc();

const ytext = doc.getText("main");

socket.emit('join-room', 'room-1', 'Kushaal');

function MonacoEditor({
  language,
  code,
  setCode,
}: MonacoEditorProps) {

  useEffect(() => {
    socket.on('sync', (state) => {
      const update = new Uint8Array(state);
      Y.applyUpdate(doc, update);

      setCode(ytext.toString());
    })

    socket.on('update', (state) => {
      const update = new Uint8Array(state);
      Y.applyUpdate(doc, update);

      setCode(ytext.toString());
    })

    doc.on('update', (update) => {
      socket.emit('update', update);
    })

  }, [])

  return (
    <div className="h-full w-full z-0">
      <Editor
        height="80vh"
        language={language.toLowerCase()}
        defaultValue="console.log('Hello World')"
        theme="vs-dark"
        value={code}
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

          model?.onDidChangeContent((event) => {
            const change = event.changes[0];
            
            ytext.delete(change.rangeOffset, change.rangeLength);
            ytext.insert(change.rangeOffset, change.text);
            
            console.log(ytext.toString());

            setCode(ytext.toString())
          })
        }}
      >
      </Editor>
    </div>
    
  );
}

export default MonacoEditor;
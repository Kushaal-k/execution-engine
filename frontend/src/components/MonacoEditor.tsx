import { Editor } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { socket2 } from '../api/socket';
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import * as monaco from "monaco-editor";
import type {
  PresenceUpdate,
} from "../../../server/src/types/types.ts"

interface MonacoEditorProps {
  language: string;
}

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

const doc = new Y.Doc();

const ytext = doc.getText("main");

function MonacoEditor({
  language,
}: MonacoEditorProps) {

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorations = useRef(new Map<string, monaco.editor.IEditorDecorationsCollection>());

  const mountFunction = (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    const model = editor.getModel();
    if (!model) return;

    editorRef.current = editor;

    const monacoBinding = new MonacoBinding(ytext, model, new Set([editor]), null);

    //TODO: Add throttle of 50ms - to save up requests
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
        activeFile: "main.js",
      });
    }, 50);

    const collection = editor.createDecorationsCollection();

    collection.set([
      {
        range: new monaco.Range(1, 1, 1, 5),
        options: {
          inlineClassName: "remote-cursor",
        },
      },
    ]);

    editor.onDidChangeCursorSelection(sendPresence);
  }

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
      console.log("1")
      if(presenceUpdate.userId === socket2.id) return;
      const editor = editorRef.current;
      console.log("2")

      if(!editor) return;
      //TODO: Add visuals to show remote cursors
      //TODO: Show users connected as well
      console.log("3");

      let collection = decorations.current.get(presenceUpdate.userId);
      if(!collection) {
        collection = editor.createDecorationsCollection();
        decorations.current.set(presenceUpdate.userId, collection);
      }

      const cursor = presenceUpdate.presence.cursor;
      if (!cursor) return;

      const range = new monaco.Range(
        cursor.lineNumber,
        cursor.column,
        cursor.lineNumber,
        cursor.column,
      )

      collection.set([
        {
          range,
          options: {
            inlineClassName: "remote-cursor"
          }
        }
      ])
      
      console.log("Updated!!");
    })

    doc.on('update', (update) => {
      socket2.emit('update', update);
    })

    return () => {
      socket2.off("sync");
      socket2.off("update");
      socket2.off("presence-update");
    }

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
        onMount={(editor, monaco) => mountFunction(editor, monaco)}
      >
      </Editor>
    </div>

  );
}

export default MonacoEditor;

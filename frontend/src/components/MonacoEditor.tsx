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
  username: string;
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

//New shared doc
const doc = new Y.Doc();

const ytext = doc.getText("main");

function MonacoEditor({
  language,
  username,
}: MonacoEditorProps) {

  //Editor ref after mount
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  //Map of decorations for each user
  const decoration = useRef(new Map<string, monaco.editor.IEditorDecorationsCollection>());
  //Current username ref
  const usernameRef = useRef(username);

  //Update username on every change
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  //Mount on monaco editor for creating yjs binding and presence update
  const mountFunction = (editor: monaco.editor.IStandaloneCodeEditor) => {
    const model = editor.getModel();
    if (!model) return;

    editorRef.current = editor;

    //Monaco Binding
    new MonacoBinding(ytext, model, new Set([editor]), null);

    //Send presence update after every 50ms
    const sendPresence = throttle(() => {
      const position = editor.getPosition();
      const selection = editor.getSelection();

      //Emit presence update to sync server for other users at 50ms interval
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
        username: usernameRef.current || "Anonymous",
      });
    }, 50);

    editor.onDidChangeCursorSelection(sendPresence);
  }

  useEffect(() => {
    socket2.emit('join-room', 'room-1', username || 'Anonymous');

    socket2.on('sync', (state) => {
      const update = new Uint8Array(state);
      Y.applyUpdate(doc, update);
    })

    socket2.on('update', (state) => {
      const update = new Uint8Array(state);
      Y.applyUpdate(doc, update);
    })

    //Capture updates of remote users and show them 
    socket2.on('presence-update', (presenceUpdate: PresenceUpdate) => {
      if(presenceUpdate.userId === socket2.id) return;
      const editor = editorRef.current;

      if(!editor) return;
      // TODO: Show users connected as well
      // TODO: Codebase is getting too big - Add comments to each part so I can understand later
      // TODO: Refactor this file as this is getting complex and confusing

      let collection = decoration.current.get(presenceUpdate.userId);
      if(!collection) {
        collection = editor.createDecorationsCollection();
        decoration.current.set(presenceUpdate.userId, collection);
      }

      const cursor = presenceUpdate.presence.cursor;
      const selection = presenceUpdate.presence.selection;
      if (!cursor) return;

      //Create Range for remote cursor
      const cursorRange = new monaco.Range(
        cursor.lineNumber,
        cursor.column,
        cursor.lineNumber,
        cursor.column,
      )

      //Create decoration for remote cursor 
      const cursorDecoration: monaco.editor.IModelDeltaDecoration = {
        range: cursorRange,
        options: {
          beforeContentClassName: "remote-cursor",
          hoverMessage: {value: presenceUpdate.presence.username}
        }
      }

      let decorations: monaco.editor.IModelDeltaDecoration[] = [
        cursorDecoration
      ]

      //Check if there is remote selection 
      const hasSelection =
        selection &&
        !(
            selection.startLineNumber === selection.endLineNumber &&
            selection.startColumn === selection.endColumn
        );
      
      //Create remote selection decoration
      if(hasSelection && selection) {
        const selectionRange = new monaco.Range(
          selection?.startLineNumber,
          selection?.startColumn,
          selection?.endLineNumber,
          selection?.endColumn,
        )

        //Applying all remote decorations
        const selectionDecoration: monaco.editor.IModelDeltaDecoration = {
          range: selectionRange,
          options: {
            className: "remote-selection",
            hoverMessage: {value: presenceUpdate.presence.username}
          }
        }

        decorations.push(selectionDecoration);
      }

      collection.set(decorations)
      
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

  }, [username])

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
        }}
        onMount={(editor) => mountFunction(editor)}
      >
      </Editor>
    </div>

  );
}

export default MonacoEditor;

import { Editor } from "@monaco-editor/react";
import { useEffect, type Dispatch, type SetStateAction } from "react";

interface MonacoEditorProps {
  language: string;
  code: string;
  setCode: Dispatch<SetStateAction<string>>;
}

function MonacoEditor({
  language,
  code,
  setCode,
}: MonacoEditorProps) {

    useEffect(() => {console.log(language)}, [language])
  return (
    <Editor
      className=""
      height="90vh"
      language={language.toLowerCase()}
      defaultValue="console.log('Hello World')"
      theme="vs-dark"
      value={code}
      onChange={(value) => setCode(value || "")}
      options={{
            suggestOnTriggerCharacters: true,
            quickSuggestions: true,
            wordBasedSuggestions: "currentDocument",
            acceptSuggestionOnEnter: "on",
            tabCompletion: "on",
        }
      }
    />
  );
}

export default MonacoEditor;
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
    <div className="80vh w-full z-0">
      <Editor
        height="80vh"
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
      >
      </Editor>
    </div>
    
  );
}

export default MonacoEditor;
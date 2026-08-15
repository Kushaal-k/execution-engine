import { useYjsSync } from "../hooks/useYjsSync";
import MonacoEditor from "./MonacoEditor";
import Sidebar from "./Sidebar";
import EditorTabs from "./EditorTabs";

export function IDE() {
  useYjsSync();

  return (
    <div className="flex flex-row flex-1 h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden relative">
      <Sidebar />
      <div className="flex-1 h-full min-w-0 flex flex-col overflow-hidden">
        <EditorTabs />
        <div className="flex-1 min-h-0 w-full">
          <MonacoEditor />
        </div>
      </div>
    </div>
  );
}

export default IDE;
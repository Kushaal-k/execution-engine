import { useEffect } from "react";
import Topbar from "./Topbar";
import IDE from "./IDE";
import BottomPanel from "./BottomPanel";
import { useExecutionStore } from "../store/executionStore";

export function InputCode() {
  const executeCode = useExecutionStore((s) => s.executeCode);

  // Global keyboard shortcut for Ctrl+Enter / Cmd+Enter to execute code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        executeCode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [executeCode]);

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <Topbar />

      <main className="flex-1 flex flex-col min-h-0 relative w-full overflow-hidden">
        <IDE />
      </main>

      <BottomPanel />
    </div>
  );
}

export default InputCode;
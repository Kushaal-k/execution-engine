import { create } from "zustand";
import type { IExecutionResponse, ExecutionStatus } from "@execution-engine/shared";
import { executionSocket } from "../api/socket";
import { ENV } from "../config/env";

export type Status = ExecutionStatus | "Idle";

interface ExecutionState {
  status: Status;
  isLoading: boolean;
  response: IExecutionResponse | null;
  error: string;
  stdin: string;
  code: string;
  language: string;
  activePanelTab: "output" | "terminal" | "stdin";
  isPanelCollapsed: boolean;

  setStdin: (val: string) => void;
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
  setActivePanelTab: (tab: "output" | "terminal" | "stdin") => void;
  setActiveTab: (tab: "output" | "terminal" | "stdin") => void;
  setIsPanelCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  clearOutput: () => void;
  executeCode: () => Promise<void>;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  status: "Idle",
  isLoading: false,
  response: null,
  error: "",
  stdin: "",
  code: 'console.log("Hello World")',
  language: "javascript",
  activePanelTab: "output",
  isPanelCollapsed: false,

  setStdin: (stdin) => set({ stdin }),
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setActivePanelTab: (activePanelTab) => set({ activePanelTab }),
  setActiveTab: (activePanelTab) => set({ activePanelTab }),
  setIsPanelCollapsed: (collapsed) =>
    set((state) => ({
      isPanelCollapsed: typeof collapsed === "function" ? collapsed(state.isPanelCollapsed) : collapsed,
    })),

  clearOutput: () => set({ response: null, error: "", status: "Idle" }),

  executeCode: async () => {
    const { code, language, stdin, isLoading } = get();
    if (!code.trim() || isLoading) return;

    set({
      isLoading: true,
      error: "",
      status: "Queued",
      activePanelTab: "output",
      isPanelCollapsed: false,
    });

    try {
      const res = await fetch(`${ENV.EXECUTION_API_URL}/api/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          language: language.toLowerCase(),
          stdin,
        }),
      });

      if (!res.ok) {
        set({
          error: "Failed to send code to execution engine.",
          status: "Failed",
          isLoading: false,
        });
        return;
      }

      const data = await res.json();
      set({ status: data.status });

      const channel = `result:${data.jobId}`;
      const handleResult = (result: IExecutionResponse) => {
        if (result.status === "Completed" || result.status === "Failed") {
          set({
            status: result.status,
            response: result,
            error: result.error || "",
            isLoading: false,
          });
          executionSocket.off(channel, handleResult);
        }
      };

      executionSocket.on(channel, handleResult);
    } catch (err) {
      console.error("Execution error:", err);
      set({
        error: "Failed to send code to execution engine.",
        status: "Failed",
        isLoading: false,
      });
    }
  },
}));

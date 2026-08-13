import { Runtime } from "./runtime.js";

export type SupportedLanguage = "javascript" | "python" | "cpp";

const LANGUAGE_IMAGES: Record<SupportedLanguage, string> = {
    javascript: "node:20-slim",
    python: "python:3.12-slim",
    cpp: "gcc:14",
};

export class RuntimeManager {
    private readonly runtimes: Map<string, Runtime>;

    constructor() {
        this.runtimes = new Map<string, Runtime>();
    }

    get(workspaceId: string): Runtime | undefined{
        return this.runtimes.get(workspaceId);
    }

    async getOrCreate(workspaceId: string, language: string): Promise<Runtime> {
        const existing = this.runtimes.get(workspaceId);
        if(existing) return existing;

        const runtime = new Runtime(workspaceId);

        await runtime.start(LANGUAGE_IMAGES[language as SupportedLanguage]);
            
        this.runtimes.set(workspaceId, runtime); 
        
        return runtime;
    }

    async destroy(workspaceId: string): Promise<void> {
        const runtime = this.runtimes.get(workspaceId);

        if(!runtime) return;

        await runtime.destroy();
        this.runtimes.delete(workspaceId);
    }
};
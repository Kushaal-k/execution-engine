import { RuntimeManager } from "./runtime-manager.js"
import { TerminalManager } from "./terminal-manager.js";
import type { TerminalSession } from "./terminalSession.js";

class RuntimeService {
    constructor (
        private readonly RuntimeManager: RuntimeManager,
        private readonly TerminalManager: TerminalManager
    ) {}

    async createTerminal (
        workspaceId: string,
        terminalId: string,
        image: string
    ): Promise<TerminalSession> {
        const runtime = await this.RuntimeManager.getOrCreate(workspaceId, image);

        return this.TerminalManager.createOrGet(terminalId, runtime);
    }
};

export default RuntimeService;
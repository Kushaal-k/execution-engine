import type { Runtime } from "./runtime.js";
import { TerminalSession } from "./terminalSession.js";

export class TerminalManager {
    private terminals: Map<string, TerminalSession>;

    constructor () {
        this.terminals = new Map<string, TerminalSession>();
    }

    get(terminalId: string): TerminalSession | undefined {
        return this.terminals.get(terminalId);
    }

    createOrGet(terminalId: string, runtime: Runtime): TerminalSession {
        const existing = this.terminals.get(terminalId); 

        if(existing) {
            return existing;
        }

        const terminal = new TerminalSession(terminalId, runtime);

        this.terminals.set(terminalId, terminal);

        return terminal;
    }

    async stop(terminalId: string): Promise<void> {
        const terminal = this.terminals.get(terminalId);

        if(!terminal) {
            return;
        }

        await terminal.stop();
    }

    async destroy(terminalId: string): Promise<void> {
        const terminal = this.terminals.get(terminalId);

        if(!terminal) {
            return;
        }

        await terminal.destroy();

        this.terminals.delete(terminalId);
    }
};
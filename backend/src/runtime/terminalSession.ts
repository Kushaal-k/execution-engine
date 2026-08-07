import type { Exec } from "dockerode";
import type { Runtime } from "./runtime.js";
import type { Duplex } from "node:stream";

type TerminalState = "idle" | "running" | "stopped" | "destroyed";  

export class TerminalSession {
    private readonly terminalId: string;
    private readonly runtime: Runtime;

    private stream: Duplex | null = null;
    private exec: Exec | null = null;

    private state: TerminalState;

    constructor(terminalId: string, runtime: Runtime) {
        this.terminalId = terminalId;
        this.state = "idle";
        this.runtime = runtime;
    }

    private onOutput: ((output: string) => void) | null = null;

    async start(): Promise<void> {
        const container = this.runtime.getContainer();

        if (!container) {
            throw new Error("Runtime container is not available");
        }

        const exec = await container.exec({
            Cmd: ["/bin/bash"],
            AttachStdin: true,
            AttachStderr: true,
            AttachStdout: true,
            Tty: true,
        });

        this.exec = exec;

        const stream = await exec.start({
            Tty: true,
            stdin: true,
            hijack: true
        });

        this.stream = stream;
        this.state = "running";

        this.stream.on("data", (data: Buffer) => {
            const output = data.toString();
            this.onOutput?.(output);
        })
    }

    async stop(): Promise<void> {

    }

    async destroy(): Promise<void> {
        const container = this.runtime.getContainer();

        if (!container) {
            throw new Error("Runtime container is not available");
        }

        if (!this.exec) {
            throw new Error("Terminal session is not running");
        }

        const info = await this.exec.inspect();

        const pid = info.Pid;

        container.exec({
            Cmd: ["kill", "-TERM", String(pid)]
        })
    }

    write(input: string): void {
        if (!this.stream) {
            throw new Error("Terminal session is not running");
        }

        this.stream.write(input);
    }

    setOutputHandler(handler: (output: string) => void): void {
        this.onOutput = handler;
    }

    getId(): string {
        return this.terminalId;
    }

    getState(): TerminalState {
        return this.state;
    }
};
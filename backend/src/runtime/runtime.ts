import {docker} from "../execution.js";
import { type Container } from "dockerode";
import { ensureImageExists } from "../execution.js";

type RuntimeState = "ready" | "idle" | "stopped" | "destroyed";

export class Runtime {

    private readonly workspaceId: string;

    private container: Container | null = null;

    private state: RuntimeState;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
        this.state = "idle";
    }

    async start(image: string): Promise<void> {
        //create container
        await ensureImageExists(image);

        const DEFAULT_MEMORY_LIMIT_MB = 256;

        const config = {
            runtime: "runc",
            memoryLimitMb: DEFAULT_MEMORY_LIMIT_MB,
            cpuQuota: 100000,
        }

        const options = {
            cwd: "/home/kushaal/projects/Execution-Engine/backend/temp:/app",
            timeout: 10000,
        }

        const container = await docker.createContainer({
            Image: image,
            User: "1000",
            WorkingDir: '/app',
            HostConfig: {
                Binds: [`${options.cwd}`],
                Runtime: config.runtime,
                Memory: config.memoryLimitMb * 1024 * 1024,
                CpuQuota: config.cpuQuota,
            },
            NetworkDisabled: true,
            StopTimeout: options.timeout,
            AttachStdin: true,
            OpenStdin: true,
            StdinOnce: true,
        });

        //start container
        await container.start();

        this.container = container;

        //set state to ready
        this.state = "ready";
    }

    async stop(): Promise<void> {
        const container = this.container;

        await container?.stop();

        this.state = "stopped";
    }

    async destroy(): Promise<void> {
        const container = this.container;

        if(!container) {
            this.state = "destroyed";
            return;
        }

        if(this.state !== "stopped") {
            await this.stop();
        }

        await container.remove();

        this.container = null;
        this.state = "destroyed";

        const exec = await container.exec({});

        exec.start({})
    }

    getContainer(): Container | null {
        return this.container;
    }

    getState(): RuntimeState {
        return this.state;
    }

    getWorkspaceId(): string {
        return this.workspaceId;
    }
};
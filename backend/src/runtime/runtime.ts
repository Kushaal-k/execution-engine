import {docker} from "../execution.js";
import { type Container } from "dockerode";
import { ensureImageExists } from "../execution.js";
import tar from "tar-stream";

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
        //Create volume in docker for files workspace
        const volumeName = `engine_ws_${this.workspaceId}`;

        await docker.createVolume({ Name: volumeName });

        //create container
        await ensureImageExists(image);

        const DEFAULT_MEMORY_LIMIT_MB = 256;

        const config = {
            runtime: "runc",
            memoryLimitMb: DEFAULT_MEMORY_LIMIT_MB,
            cpuQuota: 100000,
        }

        const options = {
            cwd: `${volumeName}:/app:rw`,
            timeout: 10000,
        }

        const container = await docker.createContainer({
            Image: image,
            WorkingDir: '/app',
            Cmd: ['sh', '-c', 'chown -R 1000:1000 /app 2>/dev/null; chmod 777 /app 2>/dev/null; tail -f /dev/null'],
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
    }

    async syncFiles(files: Array<{ path: string; content: string }>): Promise<void> {
        if (!this.container) return;

        const pack = tar.pack();

        for (const file of files) {
            const safePath = file.path.replace(/^\/+/, "");
            pack.entry({ 
                name: safePath, 
                mode: 0o644, 
                uid: 1000, 
                gid: 1000, 
                uname: "node", 
                gname: "node" 
            }, file.content);
        }

        pack.finalize();

        await this.container.putArchive(pack, { path: "/app" });
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
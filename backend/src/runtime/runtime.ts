import {docker} from "../execution.js";
import { type Container } from "dockerode";
import { ensureImageExists } from "../execution.js";
import tar from "tar-stream";
import path from "path";
import fs from "fs/promises";
import { WorkspaceWatcher } from "./workspaceWatcher.js";
import { syncClientSocket } from "../socket/syncClient.js";

type RuntimeState = "ready" | "idle" | "stopped" | "destroyed";

export class Runtime {

    private readonly workspaceId: string;

    private container: Container | null = null;
    private watcher: WorkspaceWatcher | null = null;

    private state: RuntimeState;

    constructor(workspaceId: string) {
        this.workspaceId = workspaceId;
        this.state = "idle";
    }

    private notifySyncServer(type: "add" | "change" | "unlink", relPath: string, content?: string): void {
        syncClientSocket.emit("workspace:fs-event", {
            roomId: this.workspaceId,
            type,
            path: relPath,
            ...(content !== undefined && { content }),
        });
    }

    async start(image: string): Promise<void> {
        // Create local workspace folder for real-time filesystem watching
        const workspaceDir = path.resolve(process.cwd(), "temp", "workspaces", this.workspaceId);
        await fs.mkdir(workspaceDir, { recursive: true });

        // Start filesystem watcher for container-to-IDE synchronization
        this.watcher = new WorkspaceWatcher(
            workspaceDir,
            (relPath, content) => this.notifySyncServer("add", relPath, content),
            (relPath, content) => this.notifySyncServer("change", relPath, content),
            (relPath) => this.notifySyncServer("unlink", relPath),
            (err) => console.warn("WorkspaceWatcher error:", err)
        );
        this.watcher.start();

        // Ensure base image is available
        await ensureImageExists(image);

        const DEFAULT_MEMORY_LIMIT_MB = 256;

        const config = {
            runtime: "runc",
            memoryLimitMb: DEFAULT_MEMORY_LIMIT_MB,
            cpuQuota: 100000,
        };

        const container = await docker.createContainer({
            Image: image,
            WorkingDir: '/app',
            Cmd: ['sh', '-c', 'chown -R 1000:1000 /app 2>/dev/null; chmod 777 /app 2>/dev/null; tail -f /dev/null'],
            HostConfig: {
                Binds: [`${workspaceDir}:/app:rw`],
                Runtime: config.runtime,
                Memory: config.memoryLimitMb * 1024 * 1024,
                CpuQuota: config.cpuQuota,
            },
            NetworkDisabled: true,
            StopTimeout: 10000,
            AttachStdin: true,
            OpenStdin: true,
        });

        // Start container
        await container.start();

        this.container = container;

        // Set state to ready
        this.state = "ready";
    }

    async stop(): Promise<void> {
        const container = this.container;

        await container?.stop();

        this.state = "stopped";
    }

    async destroy(): Promise<void> {
        if (this.watcher) {
            await this.watcher.stop();
            this.watcher = null;
        }

        const container = this.container;

        if (!container) {
            this.state = "destroyed";
            return;
        }

        if (this.state !== "stopped") {
            await this.stop();
        }

        await container.remove();

        this.container = null;
        this.state = "destroyed";
    }

    async syncFiles(files: Array<{ path: string; content: string }>): Promise<void> {
        if (!this.container) return;

        // Record content hashes to prevent echo loops when watcher reads disk
        for (const file of files) {
            this.watcher?.recordContent(file.path, file.content);
        }

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
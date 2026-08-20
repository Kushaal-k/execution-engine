import chokidar from "chokidar";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export class WorkspaceWatcher {
    private watcher: chokidar.FSWatcher | null = null;
    private knownHashes = new Map<string, string>();

    constructor(
        private readonly workspaceDir: string,
        private readonly onFileCreated: (relPath: string, content: string) => void,
        private readonly onFileModified: (relPath: string, content: string) => void,
        private readonly onFileDeleted: (relPath: string) => void,
        private readonly onError?: (error: Error) => void
    ) {}

    private hash(content: string): string {
        return crypto.createHash("sha256").update(content).digest("hex");
    }

    start() {
        this.watcher = chokidar.watch(this.workspaceDir, {
            ignored: [
                /(^|[\/\\])\../,        // dotfiles (.git, etc.)
                /node_modules/,         // node_modules
                /dist|build|\.next/,    // build artifacts
            ],
            persistent: true,
            ignoreInitial: true,
        });

        this.watcher
            .on("add", async (fullPath) => {
                const relPath = path.relative(this.workspaceDir, fullPath).replace(/\\/g, "/");
                try {
                    const content = await fs.readFile(fullPath, "utf8");
                    const contentHash = this.hash(content);

                    // Skip echo if identical to last known programmatic write
                    if (this.knownHashes.get(relPath) === contentHash) return;

                    this.knownHashes.set(relPath, contentHash);
                    this.onFileCreated(relPath, content);
                } catch {
                    // File might be transient
                }
            })
            .on("change", async (fullPath) => {
                const relPath = path.relative(this.workspaceDir, fullPath).replace(/\\/g, "/");
                try {
                    const content = await fs.readFile(fullPath, "utf8");
                    const contentHash = this.hash(content);

                    // Skip echo if identical to last known programmatic write
                    if (this.knownHashes.get(relPath) === contentHash) return;

                    this.knownHashes.set(relPath, contentHash);
                    this.onFileModified(relPath, content);
                } catch {
                    // File might be transient
                }
            })
            .on("unlink", (fullPath) => {
                const relPath = path.relative(this.workspaceDir, fullPath).replace(/\\/g, "/");
                this.knownHashes.delete(relPath);
                this.onFileDeleted(relPath);
            })
            .on("error", (error) => {
                this.onError?.(error instanceof Error ? error : new Error(String(error)));
            });
    }

    async stop() {
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
        this.knownHashes.clear();
    }

    /**
     * Record known content from programmatic IDE write.
     * When watcher sees this file on disk with the same content hash, it will suppress the event.
     */
    recordContent(relPath: string, content: string) {
        const normalized = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
        this.knownHashes.set(normalized, this.hash(content));
    }
}
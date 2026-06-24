// import { spawn } from "node:child_process"
// import { once } from "node:events";
// import { promises as fs } from "node:fs";
// import crypto from "node:crypto";
// import { hrtime } from "node:process";
import redis from "./redis.js";
import connectDB from "./db/config.js";
import dotenv from "dotenv";
import { ResponseModel } from "./models/response.model.js";
import Docker from "dockerode";

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

dotenv.config();
await connectDB();

const options = {
    cwd: "/home/kushaal/projects/Execution-Engine/backend/temp:/app",
    timeout: 10000,
}

export type SupportedLanguage = "javascript" | "python" | "cpp";

const LANGUAGE_IMAGES: Record<SupportedLanguage, string> = {
    javascript: "node:20-slim",
    python: "python:3.12-slim",
    cpp: "gcc:14",
};

const LANGUAGE_COMMANDS: Record<
    SupportedLanguage,
    (code: string) => string[]
> = {
    javascript: (code) => ["node", "--input-type=module", "-e", code],
    python: (code) => ["python3", "-c", code],
    cpp: (code) => ["sh", "-c", `echo '${code.replace(/'/g, "'\\''")}' > /tmp/main.cpp && g++ -o /tmp/main /tmp/main.cpp && /tmp/main`]
};

const ensureImageExists = async (image: string) => {
    try {
        console.log(`[execution engine] Checking for ${image} locally`)
        await docker.getImage(image).inspect();
        console.log(`[execution engine] ${image} found locally`)
    } catch (error) {
        const stream = await docker.pull(image);
        console.log(`[execution engine] Pulling ${image} from docker hub`);

        await new Promise((resolve, reject) => {
            docker.modem.followProgress(stream, (err, res) => {
                if (err) reject(err);
                resolve(res);
            })
        })

        console.log(`[execution engine] Pulled ${image}`);
    }
}

const DEFAULT_MEMORY_LIMIT_MB = 256;

const config = {
    runtime: "runc",
    memoryLimitMb: DEFAULT_MEMORY_LIMIT_MB,
    cpuQuota: 100000,
}



while (true) {
    const result = await redis.brpop("jobs:pending", 0);
    if (!result) continue;
    const job_id = JSON.parse(result[1]).id;

    console.log(`[execution engine] Processing job: ${job_id}`);

    try {
        const job = await ResponseModel.findById(job_id);

        if (!job) {
            console.error(`[execution engine] Job not found: ${job_id}`);
            continue;
        }

        await job.updateOne(
            { $set: { status: "Running" } }
        )

        const code = job.code;
        const language = job.language;

        const image = LANGUAGE_IMAGES[language as SupportedLanguage]

        await ensureImageExists(image);

        const startTime = performance.now();

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
            Cmd: LANGUAGE_COMMANDS[language as SupportedLanguage](code),
        })

        await container.start();

        const data = await container.wait();

        const stdout = await container.logs({
            stdout: true,
            stderr: false
        })

        const stderr = await container.logs({
            stdout: false,
            stderr: true
        })
        //TODO : Demux Stream - currently psuhing out raw respnose from header with 8B of gibberish header
        await job.updateOne({
            $set: {
                status: "Completed",
                stdout: stdout,
                error: stderr,
                executionTime: performance.now() - startTime,
                memoryUsed: 0,
                exitCode: data.StatusCode
            }
        })

        try {
            await container.remove();
        }
        catch (error) {
            console.error("[execution engine] Failed to delete container ", error)
        }
    } catch (error) {
        console.error(`[execution engine] Job ${job_id} failed:`, error);

        // Try to mark the job as failed in the DB
        try {
            await ResponseModel.findByIdAndUpdate(job_id, {
                $set: {
                    status: "Failed",
                    error: error instanceof Error ? error.message : "Unknown error",
                    executionTime: 0,
                    memoryUsed: 0,
                    exitCode: 1
                }
            });
        } catch (dbError) {
            console.error(`[execution engine] Failed to update job status:`, dbError);
        }
    }
}

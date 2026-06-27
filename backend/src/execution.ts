import connectDB from "./db/config.js";
import dotenv from "dotenv";
import { ResponseModel } from "./models/response.model.js";
import Docker from "dockerode";
import { PassThrough } from "node:stream";

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



export default async function executeCode(job_id: string) {
    // const result = await redis.brpop("jobs:pending", 0);
    // if (!result) return;
    // const job_id = JSON.parse(result[1]).id;

    console.log(`[execution engine] Processing job: ${job_id}`);

    try {
        const job = await ResponseModel.findById(job_id);

        if (!job) {
            console.error(`[execution engine] Job not found: ${job_id}`);
            return;
        }

        // await job.updateOne(
        //     { $set: { status: "Running" } }
        // )

        const code = job.code;
        const language = job.language;
        const stdin = job.stdin;

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
            AttachStdin: true,
            OpenStdin: true,
            StdinOnce: true,
        })

        const stream = await container.attach({ 
            stream: true,
            stdin: true,
            stdout: true,
            stderr: true
        });

        const stdout = new PassThrough();
        const stderr = new PassThrough();
        docker.modem.demuxStream(stream, stdout, stderr);
        
        let stdoutData = '', stderrData = '';
        const MAX_OUTPUT_LENGTH = 1024 * 512; // 512KB limit

        stdout.on('data', chunk => {
            if (stdoutData.length < MAX_OUTPUT_LENGTH) {
                stdoutData += chunk.toString();
                if (stdoutData.length > MAX_OUTPUT_LENGTH) {
                    stdoutData = stdoutData.substring(0, MAX_OUTPUT_LENGTH) + "\n...[Output Truncated]...";
                }
            }
        });

        stderr.on('data', chunk => {
            if (stderrData.length < MAX_OUTPUT_LENGTH) {
                stderrData += chunk.toString();
                if (stderrData.length > MAX_OUTPUT_LENGTH) {
                    stderrData = stderrData.substring(0, MAX_OUTPUT_LENGTH) + "\n...[Error Truncated]...";
                }
            }
        });

        await container.start();

        if (stdin) {
            stream.write(stdin);
            stream.end();
        }
        
        let isTLE = false;
        const timer = setTimeout(async () => {
            isTLE = true;
            try {
                await container.kill();
            } catch (e) {
                // Ignore if container is already dead
            }
        }, options.timeout);

        const data = await container.wait();
        clearTimeout(timer);
        
        const inspectData = await container.inspect();
        const isMLE = inspectData.State.OOMKilled;

        let finalStatus = "Completed";
        let finalError = stderrData;

        if (isTLE) {
            finalStatus = "Failed";
            finalError = "Time Limit Exceeded\n" + stderrData;
        } else if (isMLE) {
            finalStatus = "Failed";
            finalError = "Memory Limit Exceeded\n" + stderrData;
        } else if (data.StatusCode !== 0) {
            finalStatus = "Failed";
        }

        await job.updateOne({
            $set: {
                status: finalStatus,
                stdout: stdoutData,
                error: finalError,
                executionTime: performance.now() - startTime,
                memoryUsed: 0,
                exitCode: data.StatusCode
            }
        });

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
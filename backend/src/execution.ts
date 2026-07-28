import connectDB from "./db/config.js";
import dotenv from "dotenv";
import { ResponseModel } from "./models/response.model.js";
import Docker from "dockerode";
import { PassThrough } from "node:stream";
import type { IExecutionResponse, status as StatusType } from "./types/types.js";

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

dotenv.config();
await connectDB();

//Options for docker to search for files in directory locally, and timeout
const options = {
    cwd: "/home/kushaal/projects/Execution-Engine/backend/temp:/app",
    timeout: 10000,
}

//Supported Languages and their images
export type SupportedLanguage = "javascript" | "python" | "cpp";

const LANGUAGE_IMAGES: Record<SupportedLanguage, string> = {
    javascript: "node:20-slim",
    python: "python:3.12-slim",
    cpp: "gcc:14",
};

//Run command for all supported languages
const LANGUAGE_COMMANDS: Record<
    SupportedLanguage,
    (code: string) => string[]
> = {
    javascript: (code) => ["node", "--input-type=module", "-e", code],
    python: (code) => ["python3", "-c", code],
    cpp: (code) => ["sh", "-c", `echo '${code.replace(/'/g, "'\\''")}' > /tmp/main.cpp && g++ -o /tmp/main /tmp/main.cpp && /tmp/main`]
};

//Check if image exists locally - pull if not
const ensureImageExists = async (image: string) => {
    try {
        console.log(`[execution engine] Checking for ${image} locally`)
        //Get docker image information locally
        await docker.getImage(image).inspect();
        console.log(`[execution engine] ${image} found locally`)
    } catch (error) {
        //Pull otherwise
        const stream = await docker.pull(image);
        console.log(`[execution engine] Pulling ${image} from docker hub`);
        
        //Keep checking if image is pulled 
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


//Configuration for running container
const config = {
    runtime: "runc",
    memoryLimitMb: DEFAULT_MEMORY_LIMIT_MB,
    cpuQuota: 100000,
}

export default async function executeCode(job_id: string) {

    console.log(`[execution engine] Processing job: ${job_id}`);

    // Declare result fields in outer scope so `finally` can always emit them
    let status: StatusType = "Failed";
    let stdoutResult = "";
    let errorResult = "";
    let executionTime = 0;
    let memoryUsed = 0;
    let exitCode: number | null = 1;

    try {
        //Checking job in database
        const job = await ResponseModel.findById(job_id);

        if (!job) {
            console.error(`[execution engine] Job not found: ${job_id}`);
            return;
        }

        const code = job.code;
        const language = job.language;
        const stdin = job.stdin;

        const image = LANGUAGE_IMAGES[language as SupportedLanguage]

        await ensureImageExists(image);

        //Start timer for performance tracking
        const startTime = performance.now();

        //Create container with required configs
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

        //Stream for input, output and error
        const stream = await container.attach({
            stream: true,
            stdin: true,
            stdout: true,
            stderr: true
        });

        //Demux stream from docker logs to remove unwanted characters
        const stdoutStream = new PassThrough();
        const stderr = new PassThrough();
        docker.modem.demuxStream(stream, stdoutStream, stderr);

        let stdoutData = '', stderrData = '';
        const MAX_OUTPUT_LENGTH = 1024 * 512; // 512KB limit

        stdoutStream.on('data', chunk => {
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

        //Checking for time limit
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

        //check for container - logs - errors - or sudden kill
        const inspectData = await container.inspect();
        const isMLE = inspectData.State.OOMKilled;

        status = "Completed";
        errorResult = stderrData;

        if (isTLE) {
            status = "Failed";
            errorResult = "Time Limit Exceeded\n" + stderrData;
        } else if (isMLE) {
            status = "Failed";
            errorResult = "Memory Limit Exceeded\n" + stderrData;
        } else if (data.StatusCode !== 0) {
            status = "Failed";
        }

        stdoutResult = stdoutData;
        executionTime = performance.now() - startTime;
        memoryUsed = 0;
        exitCode = data.StatusCode;

        await job.updateOne({
            $set: {
                status,
                stdout: stdoutResult,
                error: errorResult,
                executionTime,
                memoryUsed,
                exitCode
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

        status = "Failed";
        errorResult = error instanceof Error ? error.message : "Unknown error";
        executionTime = 0;
        memoryUsed = 0;
        exitCode = 1;

        try {
            await ResponseModel.findByIdAndUpdate(job_id, {
                $set: {
                    status,
                    error: errorResult,
                    executionTime,
                    memoryUsed,
                    exitCode
                }
            });
        } catch (dbError) {
            console.error(`[execution engine] Failed to update job status:`, dbError);
        }
    }
    return {
        status,
        stdout: stdoutResult,
        error: errorResult,
        executionTime,
        memoryUsed,
        exitCode
    };
}
import { ChildProcess, spawn } from "node:child_process"
import { once } from "node:events";
import { promises as fs } from "node:fs";
import crypto from "node:crypto";
import { hrtime } from "node:process";
import redis from "./redis.js";
import connectDB from "./db/config.js";
import dotenv from "dotenv";
import { ResponseModel } from "./models/response.model.js";

dotenv.config();
await connectDB();

const options = {
    cwd: "/home/kushaal/projects/Execution-Engine/backend/temp",
    timeout: 10000,
}


while (true) {
    const result = await redis.brpop("jobs:pending", 0);
    if (!result) continue;
    const job_id = JSON.parse(result[1]).id;

    console.log(job_id);

    const job = await ResponseModel.findById(job_id);

    if (!job) {
        throw new Error("Job not found!!");
    }

    await job.updateOne(
        { $set: { status: "Running" } }
    )

    const id = crypto.randomUUID();

    let fileName = `main-${id}`;
    let runCommand = '';

    const code = job.code;
    const language = job.language;
    const stdin = job.stdin

    if (language.toLowerCase() === "javascript") {
        fileName += ".js"
        runCommand = "node"
    }
    else if (language.toLowerCase() === "python") {
        fileName += ".py"
        runCommand = "python3"
    }
    else if (language.toLowerCase() === "c++") {
        fileName += ".cpp"
        runCommand = `g++`
    }

    let filePath = `${options.cwd}/${fileName}`

    const MAX_BYTES = 10 * 1024 * 1024;

    try {
        await fs.writeFile(`${options.cwd}/${fileName}`, code)
        let child = spawn(`${runCommand}`, [filePath], options);

        if(language.toLowerCase() == "c++") 
            child = spawn("sh", ["-c", `g++ "${filePath}" -o main && "${options.cwd}/main"`], options);

        const start = hrtime.bigint();

        let stdout = "";
        let stderr = "";
        let totalBytes = 0;

        let killByMemoryLimit = false;

        if (stdin)
            child.stdin.write(stdin);

        child.stdin.end();

        child.stdout.on("data", data => {
            totalBytes += data.length;

            if (totalBytes > MAX_BYTES) {
                child.kill('SIGTERM')
                stderr = "Ouput Limit Exceeded!!";
                killByMemoryLimit = true;
                return;
            }

            stdout += data.toString();
        });

        child.stderr.on("data", data => {
            stderr += data.toString();
        });

        const [exitCode, signal] = await once(child, 'close');

        if (signal == 'SIGTERM' && !killByMemoryLimit) {
            stderr ||= "Time Limit Exceeded!"
        }

        const end = hrtime.bigint();

        await job.updateOne(
            {
                $set: {
                    status: "Completed",
                    stdout: stdout,
                    error: stderr,
                    executionTime: Number(end - start) / 1_000_000,
                    memoryUsed: 0,
                    exitCode: exitCode
                }
            }
        )

    }
    catch (error) {
        await job.updateOne(
            {
                $set: {
                    status: "Failed",
                    error: error,
                    executionTime: 0,
                    memoryUsed: 0,
                    exitCode: 1
                }
            }
        )
    }
    finally {
        try {
            await fs.unlink(`${options.cwd}/${fileName}`);
        } catch (error) {
            console.error("Failed to delete temp file: ", error)
        }
    }
}

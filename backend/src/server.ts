import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { promises as fs } from "node:fs";
import crypto from "node:crypto";
import { hrtime } from "node:process";
import { Redis } from "ioredis"

const app = express();

app.use(express.json());
app.use(cors())

const options = {
    cwd: "/home/kushaal/projects/Execution-Engine/backend/temp",
    timeout: 10000,
}

// const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

interface IInputCodeRequest {
    code: string,
    stdin?: string,
    language: string
}

interface IExecutionResponse {
    stdout: string,
    error: string,
    executionTime: number,
    memoryUsed: number,
    exitCode: number | null,
}

app.post('/api/response', async (req: Request<{}, {}, IInputCodeRequest>, res: Response<IExecutionResponse>) => {
    const {code, language, stdin} = req.body;

    const id = crypto.randomUUID();

    let fileName = `main-${id}`;
    let runCommand = '';
    
    if(language.toLowerCase() === "javascript") {
        fileName += ".js";
        runCommand = "node"
    }
    else if(language.toLowerCase() === "python"){
        fileName += ".py"
        runCommand = "python3"
    }
    else if(language.toLowerCase() === "c++"){
        fileName += ".cpp"
        runCommand = ""
    }

    const MAX_BYTES = 10 * 1024 * 1024;
    
    try {
        await fs.writeFile(`${options.cwd}/${fileName}`, code)
        
        const child = spawn(`${runCommand}`, [`${options.cwd}/${fileName}`], options);
        const start = hrtime.bigint();

        let stdout = "";
        let stderr = "";
        let totalBytes = 0;

        let killByMemoryLimit = false;

        if(stdin)
            child.stdin.write(stdin);

        child.stdin.end();

        child.stdout.on("data", data => {
            totalBytes += data.length;

            if(totalBytes > MAX_BYTES){
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

        if(signal  == 'SIGTERM' && !killByMemoryLimit) {
            stderr ||= "Time Limit Exceeded!"
        }
        
        const end = hrtime.bigint();

        const response: IExecutionResponse = {
            stdout, 
            error: stderr,
            executionTime: Number(end - start) / 1_000_000,
            memoryUsed: 0,
            exitCode: exitCode as number | null
        }

        res.status(200).json(response);
    } 
    catch (error) {
        res.status(200).json({
            stdout: "",
            error: "Error while processing code!",
            executionTime: 0,
            memoryUsed: 0,
            exitCode: null
        })
    }
    finally {
        try {
            await fs.unlink(`${options.cwd}/${fileName}`);
        } catch (error) {
            console.error("Failed to delete temp file: ", error)
        }
    }
})

app.listen(3000, () => {
    console.log(`App is running at http://localhost:3000`)
})
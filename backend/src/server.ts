import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import connectDB from "./db/config.js";
import dotenv from "dotenv";
import type { IExecutionResponse, IInputCodeRequest } from "./types/types.js";
import { ResponseModel } from "./models/response.model.js";
import { Server } from "socket.io";
import { createServer } from "node:http";
import { QueueEvents, Queue } from "bullmq";

dotenv.config()

export const connection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
}

connectDB();

const app = express();
app.use(express.json());
app.use(cors())

const httpServer = createServer(app);

//Initialization of socket server
export const io = new Server(httpServer, {
    cors: {
        origin: true,
        credentials: true,
    }
});

//BullMQ queue and events for jobs
const executionQueue = new Queue("execution-queue", { connection })
const queueEvents = new QueueEvents("execution-queue", { connection })

io.on("connection", (socket) => {
    console.log("Connected: ", socket.id);
})

app.post('/api/response', async (req: Request<{}, {}, IInputCodeRequest>, res: Response) => {
    const { code, language, stdin } = req.body;

    try {
        //Adding jobs in database for persistence and in BullMQ queue
        const job = await ResponseModel.create({
            code,
            ...(stdin !== undefined && { stdin }),
            language,
        })

        const job_id = job._id.toString();

        await executionQueue.add("execution-job",
            { id: job_id },
            {
                jobId: job_id,
                removeOnComplete: true,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                }
            }
        )

        return res.status(200).json({ "status": `${job.status}`, jobId: job_id })
    } catch (error) {
        return res.status(500).json({ "status": "Failed" })
    }
})

//TODO: I don't think this api is required now as i swithched from HTTP polling to socket- will check later
app.get("/api/response/:id", async (req: Request, res: Response<IExecutionResponse>) => {
    const job_id = req.params.id;

    try {
        const job = await ResponseModel.findById(job_id);

        if (!job) {
            return res.status(500)
        }
        res
            .status(200)
            .json({
                status: job.status || "Pending",
                stdout: job.stdout || "",
                error: job.error || "",
                executionTime: job.executionTime || 0,
                memoryUsed: job.memoryUsed || 0,
                exitCode: job.exitCode || 1
            })


    } catch (error) {
        if (error instanceof Error) {
            res
                .status(500)
                .json({
                    status: "Failed",
                    stdout: "",
                    error: error.message,
                    executionTime: 0,
                    memoryUsed: 0,
                    exitCode: 1
                })
        }
    }
})

//Real-time job updates sent to frontend using sockets
queueEvents.on("completed", async ({ jobId, returnvalue }) => {
    io.emit(`result:${jobId}`, returnvalue);
})

queueEvents.on("failed", async ({ jobId, failedReason }) => {
    console.log(`Job ${jobId} failed: ${failedReason}`);
    io.emit(`result:${jobId}`, { err: failedReason });
})

httpServer.listen(5000, () => {
    console.log(`App is running at http://localhost:5000`)
})

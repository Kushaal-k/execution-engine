import { Worker } from "bullmq";
import type { Job } from "bullmq";
import executeCode from "./execution.js";

const worker = new Worker(
    "execution-queue",
    async (job: Job) => {
        await executeCode(job.data.id);
    },
    {
        connection: {
            host: 'localhost',
            port: 6379,
        }
    }
);

worker.on("completed", (job, value) => {
    console.log("Job completed", job.id, value);
})

worker.on("failed", (job, error) => {
    console.log("Job failed", job?.id, error);
})
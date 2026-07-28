import { Worker } from "bullmq";
import type { Job } from "bullmq";
import executeCode from "./execution.js";

//BullMQ worker to check for jobs in queue - execution-queue and then executing it 
const worker = new Worker(
    "execution-queue",
    async (job: Job) => {
        return await executeCode(job.data.id);
    },
    {
        connection: {
            host: 'localhost',
            port: 6379,
        }
    }
);

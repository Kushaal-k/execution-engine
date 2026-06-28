import { Server } from "socket.io";
import { createServer } from "node:http";
import express from "express";
import {Redis} from "ioredis";

export const app = express();
export const httpServer = createServer(app);

export const io = new Server(httpServer, {
    cors: {
        origin: true,
        credentials: true,
    }
});

// Redis pub/sub channel for cross-process result delivery
const RESULT_CHANNEL = "execution:results";

// Publisher — used by the worker process to send results to the server
const publisher = new Redis(6379, "localhost");

export async function publishResult(jobId: string, result: object): Promise<void> {
    await publisher.publish(RESULT_CHANNEL, JSON.stringify({ jobId, result }));
}

// Subscriber — called only by the server process to relay results to Socket.io clients
export async function setupResultRelay(): Promise<void> {
    const subscriber = new Redis(6379, "localhost");

    subscriber.subscribe(RESULT_CHANNEL);

    subscriber.on("message", (channel: string, message: string) => {
        if (channel === RESULT_CHANNEL) {
            const { jobId, result } = JSON.parse(message);
            io.emit(`result:${jobId}`, result);
        }
    });

    console.log("[socket.io] Result relay listening on Redis pub/sub");
}

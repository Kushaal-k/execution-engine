# 006 - BullMQ for Job Management

## Problem

The custom Redis list queue required manual implementation of job locking, status persistence, failure handling, retry delays, and worker event listeners. As queue requirements grew, maintaining custom queue boilerplate diverted focus from execution engine optimization.

## Goal

Migrate to **BullMQ**, a Redis-based queue library for Node.js, and utilize `QueueEvents` for event-driven job completion handling.

## Architecture & Implementation

Replaced raw Redis `LPUSH`/`BRPOP` handlers with BullMQ `Queue`, `Worker`, and `QueueEvents` abstractions.

### BullMQ Workflow

```
┌────────────┐   queue.add()   ┌───────────────────┐   Worker process   ┌─────────────────┐
│ API Server │ ──────────────> │ BullMQ (Redis)    │ ─────────────────> │ Execution Engine│
└────────────┘                 │  ├── Waiting      │                    │  (Docker Container)
      │                        │  ├── Active       │                    └─────────────────┘
      │ QueueEvents listener   │  ├── Completed    │                             │
      │ (completed event)      │  └── Failed       │                             │
      └─────────────────────── │                   │ <───────────────────────────┘
                               └───────────────────┘       job.updateProgress()
```

### Server Queue Setup

```typescript
import { Queue, Worker, QueueEvents } from 'bullmq';
import { redisConnection } from './redis-config';

// 1. Ingestion Queue
export const executionQueue = new Queue('code-execution', { connection: redisConnection });

// 2. Queue Events Listener for fast notification
export const queueEvents = new QueueEvents('code-execution', { connection: redisConnection });

// 3. Worker Definition
const worker = new Worker(
  'code-execution',
  async (job) => {
    const { language, code } = job.data;
    const result = await executeInDocker(language, code);
    return result;
  },
  { connection: redisConnection, concurrency: 5 }
);
```

## Advantages of BullMQ

- **Automatic Job Lifecycle & State Machine**: Built-in state management for `waiting`, `active`, `completed`, `failed`, `delayed`.
- **Concurrency Control**: Easily configure parallel execution per worker process (`concurrency: N`).
- **Automatic Retries & Exponential Backoff**: Built-in job retry policies for transient container launch failures.
- **`QueueEvents` Pub/Sub**: Enables API servers to subscribe directly to Redis pub/sub completion events (`queueEvents.on('completed')`), resolving response promises instantly when background execution finishes.

## Lessons Learned

- Leveraging a battle-tested queue framework eliminates custom job locking, retry, and timeout boilerplate code.
- Combining BullMQ with `QueueEvents` pub/sub provides the speed of event-driven notifications with the durability of a persistent Redis backend.

## Next Steps

- Scale background worker capacity horizontally across multiple CPU cores using process managers (PM2).
- Push execution results to the client over WebSockets (Socket.IO) instead of HTTP polling.
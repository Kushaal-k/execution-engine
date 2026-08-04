# 005 - Redis Job Queue

## Problem

In the synchronous container architecture, the API server held an HTTP request connection open while creating, executing, and destroying Docker containers. When traffic spiked or long-running user scripts executed, HTTP connections timed out, API server threads stalled, and incoming requests were rejected.

## Goal

Decouple request ingestion from execution by introducing an asynchronous Redis-backed job queue.

## Architecture & Implementation

Separated the system into an **API Ingestion Server** and a **Background Worker Process**, connected via Redis.

### System Architecture

```
┌─────────┐   1. POST /execute   ┌─────────────┐   2. LPUSH job   ┌─────────────┐
│ Browser │ ───────────────────> │ API Server  │ ───────────────> │ Redis Queue │
└─────────┘                      └─────────────┘                  └─────────────┘
     │                                                                   │
     │ 4. GET /status/:jobId                                             │ 3. BRPOP job
     ▼                                                                   ▼
┌──────────────────────────────────────────────┐                  ┌─────────────┐
│ Poll Execution Status until DONE             │                  │ Background  │
└──────────────────────────────────────────────┘                  │ Worker      │
                                                                  └─────────────┘
```

### Ingestion Flow

1. Client posts code submission to `/api/submit`.
2. API server generates a unique `jobId` (UUID v4), pushes the execution payload to a Redis list (`LPUSH execution_queue`), sets initial status `{ status: 'QUEUED' }` in Redis hash storage, and immediately returns `{ jobId }` to the client.
3. The background worker consumes jobs continuously using blocking list pop (`BRPOP execution_queue 0`), executes the code inside Docker, and saves the output back to Redis under `{ status: 'COMPLETED', output }`.
4. Client polls `GET /api/status/:jobId` periodically until `status === 'COMPLETED'`.

## Why Redis?

- **High Throughput**: In-memory data store capable of sub-millisecond push/pop operations.
- **Atomic Queue Primitives**: Native list commands (`LPUSH`, `BRPOP`) ensure atomic job retrieval across worker processes.
- **Decoupled Architecture**: API server remains responsive regardless of how long execution takes in background workers.

## Problems Discovered

- **Custom Queue Edge Cases**: Managing job states (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`) manually with raw Redis strings/hashes required significant boilerplate code.
- **Lack of Auto-Retries & Timeout Cleanup**: If a worker process crashed mid-execution, jobs stuck in `PROCESSING` state were orphaned indefinitely.
- **Polling Latency Overhead**: HTTP polling from the client created unnecessary request volume and introduced artificial latency (e.g., waiting for the next 1-second polling tick).

## Lessons Learned

- Asynchronous job queues are essential for isolating web API response paths from heavyweight computational tasks.
- Building custom queue state management and worker retry logic on raw Redis commands is prone to race conditions and orphan state bugs.

## Next Steps

- Replace custom Redis list queue handling with a production-ready queue framework (BullMQ).
- Eliminate client HTTP polling by introducing WebSocket push notifications (Socket.IO).
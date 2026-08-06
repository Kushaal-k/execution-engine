# 006 - Distributed Message Queue (BullMQ & Redis)

## Overview & Problem Statement

In-memory queue data structures within single Node.js processes present single-point-of-failure vulnerabilities: process crashes purge all pending jobs, and processing capacity cannot scale horizontally across multiple instances. To implement a fault-tolerant, distributed queue system, BullMQ backed by a Redis in-memory data store was integrated.

## System Architecture & Data Flow

```
┌─────────────────┐       Add Job       ┌──────────────────────────────────────────────┐
│ Express API     │ ──────────────────> │ Redis Storage (BullMQ State Engine)          │
│ (Producer Node) │                     │  ├── Waiting Queue (FIFO List)               │
└─────────────────┘                     │  ├── Active Queue (Processing Set)           │
                                        │  ├── Completed Jobs (History Log)            │
                                        │  └── Failed Jobs (Dead Letter Queue)         │
                                        └──────────────────────┬───────────────────────┘
                                                               │
                                                               │ Pull & Process Job
                                                               ▼
                                                ┌──────────────────────────────┐
                                                │ Background Worker Node       │
                                                │ (Docker Execution Consumer)  │
                                                └──────────────────────────────┘
```

BullMQ manages job transitions across distinct lifecycle sets in Redis (`Waiting` -> `Active` -> `Completed`/`Failed`). Background workers pull jobs from `Waiting`, execute sandboxed containers, persist completion metrics to MongoDB, and publish status updates.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **Concurrency Controls** | Atomic Redis Lua Scripts | Eliminates race conditions when multiple workers pull jobs concurrently. |
| **Fault Recovery** | Heartbeat Locks (`stalledInterval`) | Detects crashed worker processes and automatically re-queues abandoned jobs. |
| **State Persistence** | Redis RDB / AOF Snapshots | In-memory execution speed with configurable disk persistence policies. |

## Architectural Discussion

- **Atomic Queue State Transitions**: BullMQ leverages Redis's single-threaded event loop and atomic Lua scripts. When a worker claims a job, a Lua script atomically verifies job state and transitions it from `Waiting` to `Active` in a single non-blocking step, guaranteeing exclusive job ownership.
- **Heartbeat Lock Recovery Mechanics**: BullMQ implements a heartbeat lock mechanism (`stalledInterval`). While processing, a worker periodically renews a Redis lock. If a worker crashes, the lock expires, and BullMQ automatically re-queues the stalled job for another worker node.

## Current Limitations

- Execution capacity is constrained by running a single background worker process.
- Queue persistence depends on Redis server snapshot policies (RDB/AOF).
- Real-time client completion notifications still rely on polling or basic HTTP callbacks.

## Future Improvements

- Scale worker execution horizontally across all host CPU cores using PM2 process management.
- Integrate Socket.IO for low-latency, real-time bi-directional job result streaming to browser clients.
- Implement automated job retry policies with exponential backoffs for transient worker failures.

## Key Takeaways

- Moving from in-memory queues to BullMQ and Redis established fault-tolerant job persistence and atomic lock handling across concurrent workers.
- Heartbeat locks provided the necessary mechanism to detect crashed workers and automatically re-queue abandoned jobs.
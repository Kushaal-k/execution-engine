# 007 - Multi-Worker Scaling (PM2 Process Cluster)

## Overview & Problem Statement

A single Node.js worker process is bounded by a single CPU core, leaving multi-core host hardware underutilized during high concurrency. To maximize container throughput and saturate available CPU cores, multiple independent worker processes were orchestrated using PM2 process management in cluster mode.

## System Architecture & Data Flow

```
                      ┌──────────────────────────────────────────────────┐
                      │ Central Redis Queue Storage (BullMQ Data Engine)  │
                      └────────────────────────┬─────────────────────────┘
                                               │
               ┌───────────────────────────────┼───────────────────────────────┐
               ▼                               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────────┐
│ Worker Process 1            │ │ Worker Process 2            │ │ Worker Process N            │
│ (PM2 Instance - CPU Core 1) │ │ (PM2 Instance - CPU Core 2) │ │ (PM2 Instance - CPU Core N) │
└──────────────┬──────────────┘ └──────────────┬──────────────┘ └──────────────┬──────────────┘
               │                               │                               │
               ▼                               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────────┐
│ Docker Sandbox Container    │ │ Docker Sandbox Container    │ │ Docker Sandbox Container    │
└─────────────────────────────┘ └─────────────────────────────┘ └─────────────────────────────┘
```

PM2 spawns isolated Node.js OS processes mapped across available CPU cores. Each worker instance connects to the central Redis queue independently, competing to claim waiting jobs.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **CPU Saturation** | Multi-Process Clustering | Bypasses single-threaded V8 engine limits by utilizing all logical CPU cores. |
| **Fault Isolation** | Process Isolation | Unhandled crashes in one worker process do not affect sibling worker instances. |
| **Zero-Downtime Updates** | Rolling Restarts (`pm2 reload`) | Enables live deployments by updating worker instances sequentially without dropping jobs. |

## Architectural Discussion

- **Horizontal Process Scaling**: Running multiple independent worker processes listening to a shared queue allows parallel job consumption across CPU cores. Queue capacity scales linearly with available core count without requiring application architecture changes.
- **Cluster Infrastructure Boundaries**: Key considerations include database connection limits (preventing connection pool exhaustion on Redis/MongoDB), memory allocation limits per worker process, and implementing graceful shutdown hooks to let workers complete active jobs before termination.

## Current Limitations

- Multiple worker instances increase database socket connections, requiring careful connection pool tuning.
- Real-time communication between server nodes and clients still requires sticky load balancing or a pub/sub backplane.
- Execution results are returned via polling rather than streaming real-time socket events.

## Future Improvements

- Implement bi-directional WebSockets via Socket.IO with a Redis Pub/Sub adapter for multi-node event broadcasting.
- Integrate real-time collaborative document editing with Yjs CRDTs.

## Key Takeaways

- Orchestrating worker processes with PM2 unlocked full hardware CPU utilization, scaling execution throughput linearly across cores.
- Managing multiple worker instances highlighted the importance of database connection pool limits and graceful shutdown handling.
# 005 - Asynchronous Job Queue Architecture

## Overview & Problem Statement

Synchronous HTTP request-response execution models bind API server threads while waiting for background Docker container lifecycles to finish. Under concurrent user traffic, API connection pools become exhausted, causing HTTP gateway timeouts and server unresponsiveness. To maintain high API availability, request ingestion was decoupled from job execution using an asynchronous Producer-Consumer Job Queue pattern.

## System Architecture & Data Flow

```
┌─────────┐    1. Submit Job (POST)    ┌──────────────────┐    2. Push Job    ┌──────────────────┐
│ Browser │ ─────────────────────────> │ Producer API     │ ────────────────> │ Job Queue        │
└─────────┘                            └──────────────────┘                   └──────────────────┘
     │                                           ▲                                     │
     │ 4. Poll Status / Receive Event            │ Return Job ID                       │ 3. Fetch Job
     ▼                                           │                                     ▼
┌────────────────────────────────────────────────┴──────────────────┐        ┌──────────────────┐
│ Client UI View                                                    │        │ Consumer Worker  │
└───────────────────────────────────────────────────────────────────┘        └──────────────────┘
```

1. **Producer (HTTP API)**: Validates request payloads, enqueues execution jobs, and returns an immediate `202 Accepted` response with a unique Job ID.
2. **Message Queue**: Holds pending execution tasks in FIFO order.
3. **Consumer (Worker Pool)**: Pulls tasks asynchronously, executes code within Docker sandboxes, updates persistent job state, and notifies clients.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **API Throughput** | Asynchronous Non-blocking Ingestion | API servers handle incoming requests in sub-milliseconds without blocking on execution. |
| **Traffic Spikes** | Queue Buffer & Backpressure | Absorbs sudden bursts of traffic by buffering jobs safely without dropping connections. |
| **Client Semantics** | Polling / WebSockets | Shifted from synchronous responses to asynchronous job status tracking on the client. |

## Architectural Discussion

- **Decoupling Web Tiers from Execution Workloads**: Synchronous processing ties up HTTP connection threads, causing thread pool exhaustion and gateway timeouts during heavy load. Queues decouple ingestion throughput from execution capacity, allowing API nodes to scale independently while protecting workers from sudden traffic spikes.
- **Managing System Backpressure**: Backpressure occurs when request arrival rates exceed worker processing rates. The queue acts as a buffer, storing pending jobs without overwhelming worker nodes, allowing consumers to process tasks at maximum sustained throughput without crashing.

## Current Limitations

- Job queue state is stored in Node.js process memory; pending jobs are lost if the server process restarts.
- Single-worker queue processing limits job execution throughput to a single consumer.
- Retries, job delays, and stalled job recovery policies are not supported by the simple in-memory queue.

## Future Improvements

- Upgrade from in-memory arrays to a distributed, persistent Redis queue using BullMQ.
- Scale worker processing horizontally using PM2 process clustering across CPU cores.
- Implement real-time WebSocket event notifications for execution job completion.

## Key Takeaways

- Decoupling API request ingestion from heavy background processing maintained web server availability under concurrent traffic.
- Shifting to asynchronous execution required establishing structured job state lifecycles (Pending, Active, Completed, Failed).
# 007 - Scaling Execution Workers with PM2

## Problem

Running a single Node.js worker process limits execution queue consumption to a single CPU core. Although individual container execution is handled by Docker, queue consumption, process orchestration, and log streaming were bottlenecked by single-threaded event loop execution under high job concurrency.

## Goal

Horizontally scale background worker capacity across all available host CPU cores using PM2 process manager without introducing race conditions or duplicate job processing.

## Architecture & Implementation

Deployed multiple worker process instances managed by PM2, all competing for jobs on the shared BullMQ queue.

### Process Distribution

```
                               ┌───────────────────┐
                               │ BullMQ Queue      │
                               │ (Redis Server)    │
                               └───────────────────┘
                                         │
                 ┌───────────────────────┼───────────────────────┐
                 ▼                       ▼                       ▼
      ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
      │ PM2 Worker Proc #1  │ │ PM2 Worker Proc #2  │ │ PM2 Worker Proc #3  │
      │ (CPU Core 0)        │ │ (CPU Core 1)        │ │ (CPU Core 2)        │
      └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
                 │                       │                       │
                 ▼                       ▼                       ▼
      ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
      │ Ephemeral Docker    │ │ Ephemeral Docker    │ │ Ephemeral Docker    │
      │ Container A         │ │ Container B         │ │ Container C         │
      └─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

### PM2 Configuration (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'api-server',
      script: './dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
    },
    {
      name: 'execution-worker',
      script: './dist/worker.js',
      instances: 'max', // Scales to available logical CPU cores
      exec_mode: 'fork',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

## Why PM2?

- **Multi-Core Utilization**: Spawns multiple isolated worker instances across all CPU cores effortlessly.
- **Process Auto-Restart**: Monitors memory usage (`max_memory_restart`) and automatically restarts crashed or memory-leaking workers without affecting adjacent processes.
- **Zero-Downtime Reloads**: Allows updating worker code seamlessly (`pm2 reload`) while active processes finish processing current queue jobs.

## System Performance Results

- **Increased Throughput**: Scaled concurrent execution capability linearly with the number of CPU cores.
- **Worker Crash Resilience**: If an individual worker process crashes due to an uncaught exception, PM2 restarts it immediately while sibling workers continue executing active jobs.

## Lessons Learned

- BullMQ handles distributed worker locking natively via Redis atomic operations, allowing multiple worker processes to safely pull from the same queue without race conditions.
- Horizontal scaling of worker processes increases total system throughput, but reducing single-job latency requires container pool optimizations.

## Next Steps

- Transition client-server notifications to WebSockets (Socket.IO).
- Prepare networking architecture for multi-user collaborative code editing.
# 008 - Real-Time Communication with Socket.IO

## Problem

The frontend relied on HTTP short polling (`setInterval` hitting `GET /api/status/:jobId` every 1 second) to check job completion. Polling introduced unwanted API request volume, increased network latency, and created a poor user experience as users waited for the next polling interval tick to view execution results.

## Goal

Replace HTTP polling with persistent WebSocket connections using **Socket.IO** to stream execution status updates and push results directly to the browser upon job completion.

## Architecture & Implementation

Integrated Socket.IO on both the React frontend and Node.js backend.

### Real-Time Flow

```
┌─────────┐    1. socket.emit('submit_code')    ┌───────────────┐    2. Add job to Queue    ┌─────────────┐
│ Browser │ ──────────────────────────────────> │ Server Socket │ ────────────────────────> │ BullMQ      │
└─────────┘                                     └───────────────┘                           └─────────────┘
     ▲                                                  │                                          │
     │                                                  │ 3. BullMQ QueueEvents completed          │
     │ 4. socket.emit('execution_result')               │                                          │
     └──────────────────────────────────────────────────┴──────────────────────────────────────────┘
```

### Server Implementation

```typescript
import { Server } from 'socket.io';
import { executionQueue, queueEvents } from './queue';

const io = new Server(httpServer, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  socket.on('submit_code', async (data) => {
    const job = await executionQueue.add('execute', data);
    socket.emit('job_queued', { jobId: job.id });

    // Listen for completion for this specific job
    const onCompleted = ({ jobId, returnvalue }) => {
      if (jobId === job.id) {
        socket.emit('execution_result', returnvalue);
        queueEvents.off('completed', onCompleted);
      }
    };

    queueEvents.on('completed', onCompleted);
  });
});
```

## Advantages of Socket.IO

- **Instant Event Delivery**: Results are pushed to the client immediately upon execution completion without artificial polling delay.
- **Bi-Directional Persistent Connection**: Keeps a single TCP connection open, drastically reducing HTTP header overhead and connection handshake latency.
- **Foundation for Real-Time Features**: Establishes the real-time networking infrastructure required for multi-user collaboration, presence, and live remote cursors.

## Lessons Learned

- Event-driven WebSocket push mechanisms align naturally with asynchronous execution workflows.
- Socket rooms and socket event listeners must be properly unbinded (`socket.off`) to prevent listener memory leaks on client reconnects.

## Next Steps

- Introduce real-time collaborative editing using Conflict-free Replicated Data Types (Yjs).
- Build multi-user session rooms and remote cursor tracking over WebSockets.
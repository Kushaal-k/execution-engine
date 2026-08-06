# 008 - Real-Time Bi-directional Messaging (Socket.IO)

## Overview & Problem Statement

Standard HTTP polling introduces significant network overhead and latency for real-time collaboration and execution streaming. Requiring client applications to poll endpoints continuously degrades server performance and delays user feedback. Socket.IO was introduced to establish persistent, bi-directional WebSocket channels between clients and the server engine.

## System Architecture & Data Flow

```
┌──────────┐         1. Handshake / Upgrade         ┌────────────────────────────────────────────────────────┐
│ Client   │ ─────────────────────────────────────> │ Socket.IO Server Engine                                │
│ Browser  │                                        │                                                        │
│ Instance │ <────────────────────────────────────> │ ┌────────────────────────────────────────────────────┐ │
└──────────┘         2. Bi-directional Events       │ │ Room Multiplexer                                   │ │
                                                    │ │  ├── Room "room-101" (User A, User B)               │ │
                                                    │ │  └── Room "room-202" (User C)                      │ │
                                                    │ └────────────────────────────────────────────────────┘ │
                                                    └────────────────────────────────────────────────────────┘
```

1. **Persistent WebSocket Transport**: Upgrades HTTP requests to persistent, low-latency WebSocket connections.
2. **Room Multiplexing**: Groups active sockets into isolated channels ("rooms"), broadcasting events instantly to all room participants.
3. **Transport Fallback**: Gracefully degrades to HTTP long-polling if WebSocket upgrades are blocked by firewalls.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **Transport Model** | WebSockets with Long-Polling Fallback | Ensures low latency while guaranteeing connectivity behind restrictive networks. |
| **Room Multiplexing** | Native Socket.IO Rooms | Simplifies multi-tenant channel broadcasting without custom message routing logic. |
| **State Overhead** | Persistent Connection State | Requires memory allocation per connected socket; demands Pub/Sub backplanes for horizontal scaling. |

## Architectural Discussion

- **Comparing Real-Time Communication Protocols**: Short polling creates high HTTP request overhead. SSE provides lightweight, single-directional server-to-client streaming over standard HTTP. WebSockets establish full-duplex, bi-directional TCP communication ideal for interactive real-time applications.
- **Scaling Stateful WebSocket Servers**: WebSockets maintain stateful socket connections. Scaling across multiple backend instances requires a **Redis Pub/Sub Adapter**. When a server receives a room event, it publishes it to Redis, which relays it across all server instances to reach all connected room sockets.

## Current Limitations

- Stateful WebSocket connections require memory per active user socket.
- Horizontal scaling across multiple socket servers requires load balancer sticky sessions or a Redis Pub/Sub adapter.
- Multi-user text editing in rooms is not yet collaborative; document buffers are independent.

## Future Improvements

- Implement Conflict-Free Replicated Data Types (Yjs CRDTs) over Socket.IO channels for collaborative editing.
- Add real-time user presence tracking, cursor coordinate positioning, and visual color badges.

## Key Takeaways

- Replacing HTTP polling with persistent WebSockets reduced client feedback latency from seconds to milliseconds.
- Socket.IO's room abstraction simplified multi-tenant channel broadcasting without custom message routing logic.
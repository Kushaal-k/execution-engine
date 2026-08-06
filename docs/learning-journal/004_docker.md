# 004 - Containerized Execution Sandbox (Docker)

## Overview & Problem Statement

Executing untrusted user code directly on the host operating system exposes backend infrastructure to severe security vulnerabilities, including host filesystem inspection, process fork bombs, unauthorized network outbound calls, and resource exhaustion. To establish strict multi-tenant security boundaries and resource quotas, code execution was isolated within ephemeral Docker containers.

## System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│ Host Operating System (Node.js Execution Engine API)                   │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Docker Container (Ephemeral Sandbox Environment)               │   │
│   │  ├── Process Isolation: PID & Mount Namespaces                 │   │
│   │  ├── Network Isolation: NetworkDisabled = true                 │   │
│   │  ├── Hardware Boundaries: Control Groups (RAM/CPU Quota)       │   │
│   │  └── User Boundaries: Non-Root Execution User (UID 1000)       │   │
│   └────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────┘
```

Incoming execution requests trigger dynamic container creation configured with runtime binaries (`node`, `python3`, `gcc`). Linux Control Groups (cgroups) cap hardware resource consumption, while Linux Namespaces provide file system and process isolation.

## Technical Trade-Offs & Design Rationale

| Hardening Flag | Setting | Security Impact |
| :--- | :--- | :--- |
| **Network Access** | `NetworkDisabled = true` | Eliminates outbound HTTP calls, socket connections, and botnet activity. |
| **Memory Boundaries** | `Memory = 256MB` | Enforces hard RAM limits to prevent host Out-Of-Memory (OOM) crashing. |
| **CPU Allocation** | `CpuQuota = 100000` | Prevents infinite single-threaded loops from starving host CPU cores. |
| **Privilege Model** | `User = "1000"` | Executes container processes under unprivileged users to prevent root escalation. |

## Architectural Discussion

- **Kernel-Level Resource Constraints**: Namespaces provide virtualized process isolation (PID namespace isolates process trees, Mount namespace isolates file systems, Network namespace cuts network interfaces). Cgroups restrict physical resource utilization, placing upper bounds on CPU, RAM, and I/O consumption per container instance.
- **Container Isolation Depth**: Multi-layered defense policies include enforcing non-root execution (`User: 1000`), disabling networking, setting read-only file systems where feasible, dropping Linux capabilities, enforcing hard cgroup RAM caps, and configuring execution timers to kill hanging containers.

## Current Limitations

- Container spawning overhead adds startup latency to synchronous HTTP execution requests.
- Docker images must be pre-pulled locally on the host machine to avoid execution timeouts.
- Requests are still processed synchronously in HTTP handlers, tying up API server connections.

## Future Improvements

- Decouple request ingestion from execution using an asynchronous job queue.
- Implement background worker pools to process execution jobs asynchronously.
- Cache warm container pools or pre-warmed runtimes to reduce cold-start execution latency.

## Key Takeaways

- Wrapping execution in Docker containers established true OS-level security boundaries, capping CPU/RAM usage and cutting off network access.
- Synchronous container creation within HTTP request threads confirmed the need for background task queues.
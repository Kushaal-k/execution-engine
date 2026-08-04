# 004 - Docker Container Execution

## Problem

Executing user code directly on the host machine using `spawn()` leaves the host vulnerable to filesystem corruption, privilege escalation, malicious outbound network requests, and resource exhaustion attacks.

## Goal

Isolate code execution within short-lived, disposable Docker containers configured with strict CPU limits, memory bounds, read-only root filesystems, and disabled network access.

## Architecture & Implementation

Each execution request creates an ephemeral container based on lightweight runtime images (e.g., `python:3.10-slim`, `gcc:latest`, `node:18-alpine`).

### Execution Flow

```
┌─────────┐      HTTP Request      ┌─────────────┐      Docker CLI / API     ┌────────────────────────┐
│ Browser │ ─────────────────────> │ API Server  │ ────────────────────────> │ Ephemeral Container    │
└─────────┘                        └─────────────┘                           │ ├── Read-Only FS       │
     ▲                                    │                                  │ ├── --memory="128m"    │
     │            Response                │       Capture stdout/stderr      │ └── --net=none         │
     └────────────────────────────────────┴──────────────────────────────────┴────────────────────────┘
```

### Docker Execution Command

```bash
docker run --rm \
  --network none \
  --memory 128m \
  --cpus 0.5 \
  -v /tmp/user_code/submission.py:/app/submission.py:ro \
  python:3.10-slim \
  python3 /app/submission.py
```

### Key Security Flags Explained

- `--rm`: Automatically removes the container container file layer upon exit.
- `--network none`: Completely disables network interface access inside the container.
- `--memory 128m`: Enforces a hard memory cap of 128 MB via Linux cgroups; process is killed with OOM if exceeded.
- `--cpus 0.5`: Restricts container CPU consumption to 50% of a single CPU core.
- `:ro`: Mounts the source code file as read-only.

## Problems & Limitations

- **Container Spin-Up Overhead**: Instantiating a fresh container for every execution request takes ~500ms to 1.5 seconds depending on host load and image size.
- **Synchronous Thread Blocking**: Running `docker run` synchronously inside the API handler blocks the Node.js request thread or HTTP response connection for the duration of the execution.
- **Docker Out-of-Memory (OOM) Handling**: Distinguishing between standard runtime error exit codes and Docker container OOM exits required checking exit status codes (e.g., exit code 137 indicates OOM).

## Lessons Learned

- Docker containers provide the necessary isolation boundaries to safely run untrusted code.
- Ephemeral container creation guarantees clean slate state per execution, but trades off startup performance.
- Synchronous container execution inside API handlers does not scale under concurrent load and requires asynchronous queuing.

## Next Steps

- Implement an asynchronous job queue (Redis) to decouple HTTP request handlers from container execution.
- Explore container pooling or worker pools to eliminate container startup latency.
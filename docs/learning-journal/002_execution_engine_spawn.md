# 002 - Streamed Process Execution & Lifecycle Control (child_process.spawn)

## Overview & Problem Statement

Transitioning beyond initial prototyping revealed critical flaws in `exec()`: memory buffering risks and lack of process lifecycle management. To stream execution outputs asynchronously and enforce Time Limit Exceeded (TLE) thresholds, the execution runner evolved to use Node.js `child_process.spawn()`.

## System Architecture & Data Flow

```
┌─────────┐    POST /execute    ┌─────────────┐    Spawn Process    ┌──────────────────────┐
│ Browser │ ──────────────────> │ Node.js API │ ──────────────────> │ Isolated Process     │
└─────────┘                     └─────────────┘                     └──────────────────────┘
     ▲                                 │                                       │
     │      Stream Response Chunks     │     stdout / stderr Event Streams     │
     └─────────────────────────────────┴───────────────────────────────────────┘
                                       │ (If timeout > limit)
                                       ▼
                             SIGTERM / SIGKILL Signal
```

`spawn()` attaches event stream listeners (`stdout.on('data')`, `stderr.on('data')`, `on('close')`). An asynchronous timer monitors execution duration, issuing OS termination signals (`SIGKILL`) if execution time exceeds pre-configured thresholds.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **Stream Management** | Event-Driven Chunks | Prevents RAM exhaustion by emitting data chunks as they arrive from stdout/stderr. |
| **Command Execution** | Direct Execution | Bypasses shell invocation by default, mitigating basic command injection vectors. |
| **Process Control** | OS Signals (`SIGKILL`) | Enables deterministic termination of infinite loops or hanging processes. |

## Architectural Discussion

- **Streamed vs Buffered Process Execution**: `exec` spawns a shell and buffers complete outputs in RAM, introducing memory exhaustion and injection vulnerabilities. `spawn` executes binaries directly without a shell, streaming data via Readable Streams and exposing process lifecycle handles suitable for streaming and resource management.
- **Handling Time Limit Exceeded (TLE)**: An asynchronous timer (`setTimeout`) is initialized upon process spawn. If the process does not emit a `close` event within the threshold, a `process.kill('SIGKILL')` signal is sent, reclaiming host CPU resources and returning a TLE status to the caller.

## Current Limitations

- Code still executes directly on the host machine without file system or process namespace isolation.
- Execution runs synchronously within the HTTP handler thread, risking API thread pool blocking under concurrent load.
- No hard CPU or memory resource caps are enforced by the host OS.

## Future Improvements

- Wrap execution inside isolated Docker containers with non-root user privileges and disabled network access.
- Enforce hardware resource quotas (cgroups for memory and CPU allocation).
- Offload execution to an asynchronous background job queue.

## Key Takeaways

- Transitioning to `spawn()` eliminated memory buffering bottlenecks, but host process isolation remained an unresolved security boundary.
- Process lifecycle control backed by OS kill signals (`SIGKILL`) is mandatory for enforcing Time Limit Exceeded bounds.
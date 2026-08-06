# 001 - Direct Host Execution (child_process.exec)

## Overview & Problem Statement

Building an online code execution engine requires executing untrusted source code across multiple languages (Python, C++, JavaScript) and returning standard output or standard error buffers to the client. In the initial prototype phase, the primary objective was establishing an end-to-end evaluation pipeline with minimal infrastructure complexity.

## System Architecture & Data Flow

```
┌─────────┐      1. POST /execute      ┌─────────────┐      2. Write File      ┌────────────────┐
│ Browser │ ─────────────────────────> │ Node.js API │ ──────────────────────> │ Temp Disk File │
└─────────┘                            └─────────────┘                         └────────────────┘
     ▲                                        │                                         │
     │        4. Return Output JSON           │       3. exec("python3 /tmp/...")       │
     └────────────────────────────────────────┴─────────────────────────────────────────┘
```

The server saved incoming source strings to temporary files on the host filesystem, invoked OS CLI compilers and interpreters using `child_process.exec()`, buffered execution output in memory, and returned JSON responses to the client.

## Technical Trade-Offs & Design Rationale

| Consideration | Approach | Trade-Off Rationale |
| :--- | :--- | :--- |
| **Setup Overhead** | Native Node.js `fs` & `child_process` | Zero external dependencies; enabled rapid API-to-runner validation. |
| **Output Buffering** | In-Memory Buffer | Simple single-callback semantics, but bounded by buffer limits (`maxBuffer`). |
| **Isolation Boundary** | Direct Host Execution | Unrestricted execution environment; exposed host kernel and process environment. |

## Architectural Discussion

- **Command Injection Risks of Shell Invocation**: `child_process.exec()` invokes a system shell (e.g. `/bin/sh`) to run command strings. Passing unsanitized input enables command injection (e.g., executing arbitrary secondary shell commands). Furthermore, untrusted processes inherit host Node.js process privileges, exposing environment variables, local files, and network interfaces.
- **In-Memory Buffering Hazards**: `exec()` buffers stdout/stderr stream outputs in RAM until process completion. High-volume output streams exceed Node.js buffer thresholds (default 1MB), triggering `ERR_CHILD_PROCESS_STDIO_MAXBUFFER` errors or crashing V8 heap memory.

## Current Limitations

- Code executes directly on the host operating system with full Node.js process privileges.
- Output is buffered entirely in memory until process completion.
- Infinite loops or memory leaks in user code can hang or crash the host server.
- No CPU, RAM, or network resource limits are enforced.

## Future Improvements

- Stream process output asynchronously using `child_process.spawn()`.
- Isolate user code execution inside containerized sandboxes (Docker).
- Enforce process execution timeouts (Time Limit Exceeded - TLE).

## Key Takeaways

- Direct host execution with `exec()` was sufficient for validating the initial request pipeline, but unsuited for untrusted code execution.
- Buffering output in RAM introduces instant memory exhaustion risks under heavy output generation.

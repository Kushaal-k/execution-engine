# 002 - Process Execution with Spawn

## Problem

The initial `exec()` implementation buffered all process output in memory before triggering the callback. This created memory pressure on the backend and prevented streaming real-time execution logs. Additionally, `exec()` invoked a shell instance (`/bin/sh`), adding unnecessary execution overhead and shell injection risks.

## Goal

Transition from shell execution to direct binary execution using Node.js `spawn()`, enable real-time output streaming, and implement basic process timeout controls.

## Architecture & Implementation

`child_process.spawn()` launches a new process directly without spawning an intermediary shell, emitting stream events on `stdout` and `stderr`.

### Execution Flow

```
┌─────────┐       HTTP Request       ┌─────────────┐       spawn()       ┌────────────────┐
│ Browser │ ───────────────────────> │ API Server  │ ──────────────────> │ Child Process  │
└─────────┘                          └─────────────┘                     └────────────────┘
     ▲                                      │                                    │
     │          Streaming Response          │       stdout.on('data') event      │
     └──────────────────────────────────────┴────────────────────────────────────┘
```

### Backend Workflow

1. The API receives source code and writes it to a temporary file.
2. The server spawns a child process directly (e.g., `spawn('python3', ['/tmp/submission.py'])`).
3. Stream listeners collect output chunks dynamically:
   ```javascript
   const { spawn } = require('child_process');
   const child = spawn('python3', ['/tmp/submission.py']);
   let output = '';

   child.stdout.on('data', (chunk) => { output += chunk.toString(); });
   child.stderr.on('data', (chunk) => { output += chunk.toString(); });

   // Set timeout guard to prevent infinite loops
   const timer = setTimeout(() => {
     child.kill('SIGKILL');
   }, 5000);

   child.on('close', (code) => {
     clearTimeout(timer);
     res.json({ output, exitCode: code });
   });
   ```

## Why This Approach?

- **Streamed Output**: Standard output and error streams are processed incrementally as data arrives.
- **No Shell Invocation**: Spawning binaries directly with an argument array avoids shell parsing overhead and eliminates basic shell injection vulnerabilities.
- **Process Lifecycle Control**: Exposed child process reference allows sending explicit signals like `SIGTERM` or `SIGKILL` on timeout.

## Problems Discovered

- **Host System Exposure**: Although execution control improved, the child process still runs on the host machine with access to host files, network interfaces, and environment variables.
- **Lack of Hard Resource Cgroups**: Process timeout with `SIGKILL` prevents infinite loops, but user code can still exhaust host memory or fork bomb before the timer expires.
- **Concurrent Request Degradation**: Multiple concurrent execution requests spawn child processes on the same server, quickly overwhelming host CPU resources.

## Lessons Learned

- `spawn()` provides far superior process control and memory safety compared to `exec()`.
- Timeout mechanisms implemented via `setTimeout` and process signals (`SIGKILL`) are necessary for process lifecycle safety.
- Process-level separation on a shared host OS is insufficient for isolating untrusted code. Operating system isolation (containers) is mandatory.

## Next Steps

- Transition execution to ephemeral Docker containers to enforce containerized cgroups (CPU, memory limits).
- Build a user interface with code editor capabilities to replace raw text inputs.
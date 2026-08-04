# 001 - Direct System Execution (exec)

## Problem

Building an online code execution engine requires executing untrusted, user-submitted code in languages like Python, C++, and JavaScript from a browser interface. In the initial prototype, the immediate objective was to establish a working request-execution pipeline with minimal infrastructure complexity.

## Goal

Validate the end-to-end flow: accept code from the browser, execute it on the backend, and return standard output (`stdout`) or standard error (`stderr`) back to the client.

## Architecture & Implementation

The initial implementation used Node.js's built-in `child_process.exec()` function.

### Execution Flow

```
┌─────────┐      POST /execute      ┌─────────────┐      Write file      ┌────────────────┐
│ Browser │ ──────────────────────> │ Node.js API │ ───────────────────> │ Temp Disk File │
└─────────┘                         └─────────────┘                      └────────────────┘
     ▲                                     │                                     │
     │            JSON Response            │           exec("python3 ...")       │
     └─────────────────────────────────────┴─────────────────────────────────────┘
```

### Backend Workflow

1. The API receives the raw source code string and language choice via an HTTP POST request.
2. The server writes the code to a temporary file on the host filesystem (e.g., `/tmp/submission.py`).
3. The server executes a shell command using `exec()`:
   ```javascript
   const { exec } = require('child_process');
   exec(`python3 /tmp/submission.py`, (error, stdout, stderr) => {
     res.json({ output: stdout || stderr });
   });
   ```
4. Output captured in the callback buffer is returned directly to the browser.

## Why This Approach?

- **Zero External Dependencies**: Uses native Node.js core modules (`fs`, `child_process`).
- **Rapid Prototyping**: Allowed testing the full frontend-backend integration in less than a day.
- **Proof of Concept**: Confirmed that source code can be transferred, executed, and evaluated over standard HTTP.

## Problems Discovered

- **Host Security Vulnerability**: Code runs directly on the backend host machine with the user privileges of the Node.js process. User code can read host environment variables, modify system files, or open network connections.
- **Command Injection Risk**: Concatenating shell commands without strict sanitization exposes the system to command injection (e.g., submitting `; rm -rf /`).
- **Memory Buffer Overflow**: `exec()` buffers the entire output in memory (default `maxBuffer` is 1MB). If code generates excessive output, the process throws `ERR_CHILD_PROCESS_STDIO_MAXBUFFER`.
- **No Resource Limits**: An infinite loop (`while(true)`) or memory leak in user code hangs the Node.js thread or consumes 100% of host CPU/RAM.

## Lessons Learned

- Direct host execution using `exec()` is suitable only for local smoke tests, not for running untrusted code in production.
- Buffering process output in memory creates scalability and memory safety hazards.
- System isolation and resource limits must be enforced at the operating system level rather than relying on application code.

## Next Steps

- Replace `exec()` with `spawn()` to stream output line-by-line and gain better process lifecycle handles.
- Move execution off the host OS and into isolated Docker containers with restricted permissions.

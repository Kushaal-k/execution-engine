import { RuntimeManager } from "./runtime-manager.js";
import { TerminalSession } from "./terminalSession.js";

const manager = new RuntimeManager();

const runtime = await manager.getOrCreate(
    "workspace-1",
    "gcc:14"
);

const terminal = new TerminalSession(
    "terminal-1",
    runtime
);

terminal.setOutputHandler((output) => {
    console.log("TERMINAL:", output);
});

await terminal.start();

console.log("STATE:", terminal.getState());

terminal.write("pwd\n");

setTimeout(() => {
    terminal.write("ls\n");
}, 500);

setTimeout(() => {
    terminal.destroy();
    console.log("Terminal Destroyed!!")
}, 1000)

setTimeout(() => {
        runtime.destroy();
    }, 1500)
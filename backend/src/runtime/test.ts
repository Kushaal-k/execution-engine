import { RuntimeManager } from "./runtime-manager.js";
import { TerminalManager } from "./terminal-manager.js";
import RuntimeService from "./workspaceRuntimeService.js";

const runtimeManager = new RuntimeManager();
const terminalManager = new TerminalManager();

const service = new RuntimeService(
    runtimeManager,
    terminalManager
);

const terminal = await service.createTerminal(
    "workspace-1",
    "terminal-1",
    "gcc:14"
);

terminal.setOutputHandler((output) => {
    console.log("TERMINAL:", output);
});

await terminal.start();

terminal.write("pwd\n");
terminal.write("ls\n");
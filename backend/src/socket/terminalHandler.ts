import type { Socket } from "socket.io";
import RuntimeService from "../runtime/workspaceRuntimeService.js"
import { TerminalManager } from "../runtime/terminal-manager.js";

export function terminalHandler(socket: Socket, runtimeService: RuntimeService, terminalManager: TerminalManager) {

    socket.on('terminal:open', async (workspaceId: string, terminalId: string, image: string) => {
        const terminal = await runtimeService.createTerminal(workspaceId, terminalId, image);

        terminal.setOutputHandler((output) => {
            socket.emit('terminal:output', {terminalId, output});
        })

        await terminal.start();
    })

    socket.on('terminal:input', (terminalId: string, input: string) => {
        const terminal = terminalManager.get(terminalId);

        terminal?.write(input);
    })

    socket.on('terminal:stop', async (terminalId: string) => {
        await terminalManager.stop(terminalId);
    })

    socket.on('terminal:destroy', async (terminalId: string) => {
        await terminalManager.destroy(terminalId);
    })
}   
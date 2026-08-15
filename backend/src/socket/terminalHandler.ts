import type { Socket } from "socket.io";
import RuntimeService from "../runtime/workspaceRuntimeService.js"
import { TerminalManager } from "../runtime/terminal-manager.js";
import { RuntimeManager } from "../runtime/runtime-manager.js";

export function terminalHandler(socket: Socket, runtimeService: RuntimeService, terminalManager: TerminalManager, runtimeManager: RuntimeManager) {

    const terminals = new Set<string>();

    function isOwner(terminalId: string): boolean {
        if(terminals.has(terminalId)) {
            return true;
        }
        return false;
    }

    socket.on('terminal:open', async (workspaceId: string, terminalId: string, language: string) => {
        try {
            const terminal = await runtimeService.createTerminal(workspaceId, terminalId, language);
            
            terminal.setOutputHandler((output) => {
                socket.emit('terminal:output', {terminalId, output});
            })

            await terminal.start();

            socket.emit('terminal:opened', {terminalId});
            terminals.add(terminalId);
        }
        catch (error) {
            socket.emit('terminal:error', {
                terminalId,
                message: error instanceof Error ? error.message : 'Failed to open terminal'
            });
        }
    })

    socket.on('terminal:input', (terminalId: string, input: string) => {
        if(isOwner(terminalId)) {
            const terminal = terminalManager.get(terminalId);

            terminal?.write(input);
        }
        else {
            socket.emit('terminal:error', {
                terminalId,
                message: "Terminal Not Found!!"
            })
        }
    })

    socket.on('terminal:stop', async (terminalId: string) => {
        if(isOwner(terminalId)) {
            await terminalManager.stop(terminalId);
        }
        else {
            socket.emit('terminal:error', {
                terminalId,
                message: "Terminal Not Found!!"
            })
        }
    })

    socket.on('terminal:destroy', async (terminalId: string) => {
        if(isOwner(terminalId)) {
            await terminalManager.destroy(terminalId);
            terminals.delete(terminalId);
        }
        else {
            socket.emit('terminal:error', {
                terminalId,
                message: "Terminal Not Found!!"
            })
        }
    })

    socket.on('workspace:sync-files', async (data: { 
        workspaceId: string,
        files: Array<{ path: string, content: string }>
    }) => {
        try {
            const runtime = runtimeManager.get(data.workspaceId);
            if (runtime && runtime.getContainer()) {
                await runtime.syncFiles(data.files);
                socket.emit('workspace:synced', { workspaceId: data.workspaceId });
            }
        } catch (error) {
            socket.emit('terminal:error', {
                message: error instanceof Error ? error.message : 'Failed to sync workspace files'
            })
        }
    })

    socket.on('disconnect', async () => {
        for (const terminalId of terminals) {
            await terminalManager.destroy(terminalId);
        }
        terminals.clear();
    })
}   
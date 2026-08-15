import { socket } from "./socket";

export const terminalEvents = {
    openTerminal: (workspaceId: string, terminalId: string, language: string) => 
        socket.emit('terminal:open', workspaceId, terminalId, language),
    sendInputTerminal: (terminalId: string, input: string) => 
        socket.emit('terminal:input', terminalId, input),
    stopTerminal: (terminalId: string) => 
        socket.emit('terminal:stop', terminalId),
    destroyTerminal: (terminalId: string) => 
        socket.emit('terminal:destroy', terminalId)
}

export const terminalListeners= {
    onOpened: (callback: (data: { terminalId: string, message: string }) => void) => {
        socket.on('terminal:opened', callback)
    },
    onError: (callback: (data: { terminalId: string, message: string }) => void) => {
        socket.on('terminal:error', callback)
    },
    onOutput: (callback: (data: { terminalId: string, output: string }) => void) => {
        socket.on('terminal:output', callback)
    }
}
import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { terminalEvents, terminalListeners } from "../api/terminalEvents";
import "@xterm/xterm/css/xterm.css";

function TerminalView() {
    const terminalRef = useRef<HTMLDivElement>(null);
    const terminalId = crypto.randomUUID();

    useEffect(() => {
        const terminal = new Terminal();

        terminal.open(terminalRef.current!);
        terminal.focus();

        terminal.write("Tessera Terminal\r\n");
        terminal.write("$ ");

        terminal.onData((input) => {
            terminalEvents.sendInputTerminal(terminalId, input);
        });

        terminalListeners.onOutput((data) => {
            if (data.terminalId === terminalId) {
                terminal.write(data.output);
            }
        })

        return () => {
            terminal.dispose();
        };
    }, []);

    return <div ref={terminalRef} tabIndex={0} className="text-white"/>;
}

export default TerminalView;
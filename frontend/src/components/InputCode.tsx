import { useState, useEffect, useCallback } from "react";
import Topbar from "./Topbar";
import OutputArea from "./OutputArea";
import { socket } from "../api/socket.js";
import IDE from "./IDE";
import TerminalView from "./TerminalView.js";

export type Status = "Queued" | "Pending" | "Completed" | "Failed";

type executionResponse = {
    status: Status;
    stdout: string;
    error: string;
    executionTime: number;
    memoryUsed: number;
    exitCode: number | null;
};

function InputCode() {
    const [code, setCode] = useState<string>('console.log("Hello World")');
    const [language, setLanguage] = useState<string>('Javascript');
    const [loading, setLoading] = useState<boolean>(false);
    const [stdin, setStdin] = useState<string>('');
    const [response, setResponse] = useState<executionResponse | null>(null);
    const [, setJobId] = useState<string>("");
    const [status, setStatus] = useState<Status>("Completed");
    const [error, setError] = useState<string>("");
    const [username, setUsername] = useState<string>("");

    const handleSubmit = useCallback(async () => {
        if (!code.trim() || loading) return;

        setLoading(true);
        setError("");
        try {
            const res = await fetch("http://localhost:5000/api/response", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    code,
                    language: language.toLowerCase(),
                    stdin,
                }),
            });

            if (!res.ok) {
                setError("Failed to send code to execution engine.");
                setLoading(false);
                return;
            }

            const data = await res.json();
            setJobId(data.jobId);
            setStatus(data.status);
            jobPolling(data.jobId);
        } catch (err) {
            setError("Failed to send code to execution engine.");
            console.error("Failed to send code: ", err);
            setLoading(false);
        }
    }, [code, language, stdin, loading]);

    async function jobPolling(jobId: string) {
        socket.on(`result:${jobId}`, (data: executionResponse) => {
            if (data.status === 'Completed' || data.status === 'Failed') {
                setStatus(data.status);
                setResponse({
                    status: data.status,
                    stdout: data.stdout,
                    error: data.error,
                    executionTime: data.executionTime,
                    memoryUsed: data.memoryUsed,
                    exitCode: data.exitCode,
                });
                setLoading(false);
                return;
            }

            socket.off(`result:${jobId}`);
        });
    }

    const handleClearOutput = () => {
        setResponse(null);
        setError("");
    };

    // Global keyboard shortcut for Ctrl+Enter / Cmd+Enter to execute code
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleSubmit]);

    return (
        <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
            <Topbar
                handleSubmit={handleSubmit}
                loading={loading}
                status={status}
                username={username}
                setUsername={setUsername}
            />

            <main className="flex-1 flex flex-col min-h-0 relative w-full overflow-hidden">
                <IDE
                    username={username}
                    language={language}
                    setCode={setCode}
                    setLanguage={setLanguage}
                />
            </main>

            <OutputArea
                stdout={response?.stdout ?? null}
                error={response?.error || error}
                executionTime={response?.executionTime}
                memoryUsed={response?.memoryUsed}
                exitCode={response?.exitCode}
                status={status}
                stdin={stdin}
                setStdin={setStdin}
                onClearOutput={handleClearOutput}
            />
            <TerminalView/>
        </div>
    );

}

export default InputCode;
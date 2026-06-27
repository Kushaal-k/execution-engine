import { useState } from "react";
import MonacoEditor from "./MonacoEditor"
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import OutputArea from "./OutputArea";
import InputArea from "./InputArea";
import { io } from "socket.io-client";

export type Status = "Queued" | "Pending" | "Completed" | "Failed";

type executionResponse =  {
    status: Status
    stdout: string,
    error: string,
    executionTime: number,
    memoryUsed: number,
    exitCode: number | null,
}

type Input = {
    code: string,
    stdin?: string,
    language: string
}

const socket = io("http://localhost:3000"); 

function InputCode() {
    const [code, setCode] = useState<string>('console.log("Hello World")');
    const [language, setLanguage] = useState<string>('Javascript');
    const [loading, setLoading] = useState<boolean>(false);
    const [stdin, setStdin] = useState<string>('');
    const [response, setResponse] = useState<executionResponse | null>(null);
    const [jobId, setJobId] = useState<string>("");
    const [status, setStatus] = useState<Status>("Completed");
    const [error, setError] = useState<string>("");

    const handleSubmit = async () => {
        if(code.trim()){
            console.log('Button clicked!!')
            setLoading(true);
            try {
                const response = await fetch("http://localhost:3000/api/response", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(
                        {
                            code,
                            language: language.toLowerCase(),
                            stdin,
                        }
                    )
                });

                if(!response.ok) {
                    setError("Failed to send code");
                    return;
                }
                
                const data = await response.json();
                setJobId(data.jobId);
                setStatus(data.status);
                jobPolling(data.jobId);
            }       
            catch (error) {
                setError("Failed to send code");
                console.error("Failed to send code: ", error);
            }

            setLoading(false);
        }
    }

    async function jobPolling(jobId: string) {
        const url = `http://localhost:3000/api/response/${jobId}`;

        socket.on(`result:${jobId}`, (data: executionResponse) => {
            if(data.status == 'Completed' || data.status == 'Failed') {
                setStatus(data.status)
                setResponse({
                    status: data.status,
                    stdout: data.stdout,
                    error: data.error,
                    executionTime: data.executionTime,
                    memoryUsed: data.memoryUsed,
                    exitCode: data.exitCode,
                })
                return;
            }

            socket.off(`result:${jobId}`);
        })

        // try {
        //     const response = await fetch(url);
        //     const data: executionResponse = await response.json();

        //     if(data.status == "Completed" || data.status == "Failed"){
        //         setStatus(data.status)
        //         setResponse({
        //             status: data.status,
        //             stdout: data.stdout,
        //             error: data.error,
        //             executionTime: data.executionTime,
        //             memoryUsed: data.memoryUsed,
        //             exitCode: data.exitCode,
        //         })

        //         return;
        //     }

        //     setTimeout(() => jobPolling(jobId), 3250);
        // } 
        // catch (error) {
        //     if(error instanceof Error){
        //         setResponse({
        //             status: "Failed",
        //             stdout: "",
        //             error: `Polling Failed, ${error.message}`,
        //             executionTime: 0,
        //             memoryUsed: 0,
        //             exitCode: 1,
        //         })
        //     }  
        // }
    }

    return (
        <div className="flex items-center justify-center flex-col bg-gray-700">
            <Topbar language={language} setLanguage={setLanguage} handleSubmit={handleSubmit} loading={loading} status={status}/>
            <Sidebar/>
            <div className="relative w-full h-[80vh]">
                <MonacoEditor code={code} setCode={setCode} language={language}/>
                <div className="absolute bottom-0 w-full z-20">
                    <InputArea stdin={stdin} setStdin={setStdin} />
                </div>
            </div>
            {response?.error.trim() && <div className="w-full border border-red-800 bg-red-400 flex justify-center items-center py-4 px-10 my-2 rounded-xl">{response?.error || error}</div>}
            <OutputArea stdout={response?.stdout || "Press Run Code to see output of your code."}/>
        </div>
    )
}

export default InputCode
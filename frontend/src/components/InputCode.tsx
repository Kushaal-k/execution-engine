import { useState } from "react";
import MonacoEditor from "./MonacoEditor"

type Status = "Queued" | "Pending" | "Completed" | "Failed";

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
                            language,
                            stdin,
                        }
                    )
                });

                if(!response.ok) {
                    
                }
                
                const data = await response.json();
                setJobId(data.jobId);
                setStatus(data.status);
                jobPolling(data.jobId);
            }       
            catch (error) {
                console.error("Failed to send code: ", error);
            }

            
        }
    }

    async function jobPolling(jobId: string) {
        const url = `http://localhost:3000/api/response/${jobId}`;

        try {
            const response = await fetch(url);
            const data: executionResponse = await response.json();

            if(data.status == "Completed"){
                setStatus("Completed")
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

            setTimeout(() => jobPolling(jobId), 2000);
        } 
        catch (error) {
            if(error instanceof Error){
                setResponse({
                    status: "Failed",
                    stdout: "",
                    error: `Polling Failed, ${error.message}`,
                    executionTime: 0,
                    memoryUsed: 0,
                    exitCode: 1,
                })
            }
            
        }
    }

    return (
        <div className="flex items-center justify-center flex-col p-10 bg-gray-700">
            <MonacoEditor code={code} setCode={setCode} language={language}/>
            <textarea className="w-full h-10 rounded-lg border border-gray-500 my-6 px-4 py-2 text-gray-300 placeholder:text-gray-300" placeholder="Input for your code" value={stdin} onChange={(e) => setStdin(e.target.value)}/>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border border-gray-400 rounded-lg px-4 py-2 my-2 selection:">
                <option>Javascript</option>
                <option>Python</option>
                <option>C++</option>
            </select>
            <button 
                className="flex items-center justify-center px-8 py-2 my-4 bg-amber-400 rounded"
                onClick={handleSubmit} 
                disabled={loading}
            >
                {status!= "Failed" ? `${status as string}` : "Run Code"}</button>
            {response?.error.trim() && <div className="w-full border border-red-800 bg-red-400 flex justify-center items-center py-4 px-10 my-2 rounded-xl">{response?.error}</div>}
            <div className="w-full rounded-xl border border-gray-500 h-10 px-4 py-2 text-gray-300">
                {response?.stdout}
            </div>
        </div>
    )
}

export default InputCode
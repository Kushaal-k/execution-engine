import { useState } from "react";
import MonacoEditor from "./MonacoEditor"

type executionResponse =  {
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
                    throw new Error("Error while sending HTTP request")
                }
                
                const data:executionResponse = await response.json();
                setResponse(data);
                setLoading(false);
            }       
            catch (error) {
                console.error("Failed to send code: ", error);
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
                {loading ? "Running..." : "Run Code"}</button>
            {response?.error.trim() && <div className="w-full border border-red-800 bg-red-400 flex justify-center items-center py-4 px-10 my-2 rounded-xl">{response?.error}</div>}
            <div className="w-full rounded-xl border border-gray-500 h-10 px-4 py-2 text-gray-300">
                {response?.stdout}
            </div>
        </div>
    )
}

export default InputCode
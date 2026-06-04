import { useState } from "react";
import { Editor } from "@monaco-editor/react"

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
    const [code, setCode] = useState<string>('');
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
        <div className="flex items-center justify-center flex-col">
            {/* <textarea className="
                w-full
                rounded-xl
                border
                border-gray-200
                bg-white
                px-4
                py-3
                text-gray-900
                placeholder:text-gray-400
                shadow-sm
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-500/20
                focus:outline-none
                transition" 
                placeholder="Input your code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
            /> */}
            <Editor
                height="90vh"
                defaultLanguage={language}
                defaultValue="Coding is LOVE"
                value={code}
                onChange={(value => setCode(value || ""))}
            />
            <input type="text" className="w-full h-8 rounded-lg border border-gray-400 my-6 px-4 py-4" placeholder="Input for your code" value={stdin} onChange={(e) => setStdin(e.target.value)}/>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border border-gray-400 rounded-lg px-4 py-2 my-2">
                <option className="rounded">Javascript</option>
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
            <div className="w-full rounded-xl border border-gray-200 px-4 py-3">
                {response?.stdout}
            </div>
        </div>
    )
}

export default InputCode
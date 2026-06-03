import { useState } from "react";

function InputCode() {
    const [code, setCode] = useState<string>('');
    const [output, setOutput] = useState<string>('Output');
    const [language, setLanguage] = useState<string>('Javascript');
    const [submitted, setSubmitted] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleSubmit = async () => {
        if(code.trim()){
            setSubmitted(true);
            try {
                const response = await fetch("http://localhost:3000/api/response", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(
                        {
                            code,
                            language
                        }
                    )
                });

                if(!response.ok) {
                    throw new Error("Error while sending HTTP request")
                }
                
                const data = await response.json();
                setOutput(data.output);
                setError(data.error);
            }       
            catch (error) {
                console.error("Failed to send code: ", error);
            }
        }
        

    }

    return (
        <div className="flex items-center justify-center p-40 flex-col">
            <textarea className="
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
            />
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="border border-gray-400 rounded-lg px-4 py-2 my-2">
                <option className="rounded">Javascript</option>
                <option>Python</option>
                <option>C++</option>
            </select>
            <button className="flex items-center justify-center px-8 py-2 my-4 bg-amber-400 rounded"
                    onClick={handleSubmit} 
                >
                Submit</button>
            {submitted && <div>Code Submitted</div>}
            {error.trim() && <div className="w-full border border-red-800 bg-red-400 flex justify-center items-center py-4 px-10 my-2 rounded-xl">{error}</div>}
            <div className="w-full rounded-xl border border-gray-200 px-4 py-3">
                {output}
            </div>
        </div>
    )
}

export default InputCode
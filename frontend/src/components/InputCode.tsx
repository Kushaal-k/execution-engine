import { useState } from "react";

function InputCode() {
    const [code, setCode] = useState<string>('');
    const [output, setOutput] = useState<string>('Output');
    const [submitted, setSubmitted] = useState<boolean>(false);

    const handleSubmit = async () => {
        if(code.trim()){
            setSubmitted(true);
            try {
                const response = await fetch("http://localhost:3000/api/response", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({code})
                });

                if(!response.ok) {
                    throw new Error("Error while sending HTTP request")
                }
                
                const data = await response.json();
                setOutput(data.output);
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
            <button className="flex items-center justify-center px-8 py-2 my-4 bg-amber-400 rounded"
                    onClick={handleSubmit} 
                >
                Submit</button>
            {submitted && <div>Code Submitted</div>}

            <div className="w-full rounded-xl border border-gray-200 px-4 py-3">
                {output}
            </div>
        </div>
    )
}

export default InputCode
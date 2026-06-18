import type { Dispatch, SetStateAction, MouseEventHandler } from "react";
import { Select } from "@headlessui/react";

interface ITopBarProps {
    language: string,
    setLanguage: Dispatch<SetStateAction<string>>,
    loading: boolean,
    handleSubmit: MouseEventHandler<HTMLButtonElement>,
    status: string
}

function Topbar({ language, setLanguage, handleSubmit, loading, status } : ITopBarProps) {
    
    return (
        <div className="z-2 top-0 w-full h-16 bg-blue-900 flex items-center justify-between px-8">
            <div className="text-2xl">
                Tessera.io - Execution Engine
            </div>
            <div className="flex items-center gap-12">
            <div>
                <Select value={language} onChange={(e) => setLanguage(e.target.value)} data-focus data-hover className="border border-gray-500 px-8 py-2 rounded">
                    <option className="text-black">Javascript</option>
                    <option className="text-black">Python</option>
                    <option className="text-black">C++</option>
                </Select>
            </div>
            <div>
                <button 
                className="flex items-center justify-center px-8 py-2 my-4 bg-amber-400 rounded"
                onClick={handleSubmit} 
                disabled={loading}
            >
                {status!= "Completed" ? `${status as string}` : "Run Code"}</button>
            </div>
            </div>
        </div>
    )
}

export default Topbar
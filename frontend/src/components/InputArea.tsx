import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface InputAreaProps {
    stdin: string,
    setStdin: (value: string) => void
}

function InputArea({
    stdin,
    setStdin
} : InputAreaProps) {

    const [isOpen, setIsOpen] = useState(false)

    if (!isOpen) {
        return (
            <div 
                className="w-full bg-gray-800 border-t border-gray-600 flex justify-end p-1 text-gray-300 cursor-pointer hover:bg-gray-700 transition-colors"
                onClick={() => setIsOpen(true)} >
                <span className="text-sm mr-2 mt-0.5 select-none font-medium">Input Area</span>
                <ChevronUp />
            </div>
        )
    }

    return (
        <div className="w-full z-20 relative bg-gray-800 border-t border-gray-600 shadow-lg shadow-black/50">
            <div className="flex justify-between items-center bg-gray-800 px-3 py-1 border-b border-gray-700">
                <span className="text-sm text-gray-300 font-medium select-none">Input Area</span>
                <ChevronDown className="text-gray-300 cursor-pointer hover:text-white" onClick={() => setIsOpen(false)} />
            </div>
            <div className="p-2">
                <textarea 
                    className="w-full h-24 border border-gray-600 rounded-md px-4 py-2 bg-gray-900 text-gray-300 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y" 
                    placeholder="Input for your code..." 
                    value={stdin} 
                    onChange={(e) => setStdin(e.target.value)}
                />
            </div>
        </div>
    )
}

export default InputArea
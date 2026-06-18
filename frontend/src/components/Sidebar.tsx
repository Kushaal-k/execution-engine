import { FileBracesCorner, Menu, X } from "lucide-react"
import { useState } from "react"

function Sidebar() {

    const [close, setClose] = useState(true);

    if(close) {
        return (
            <div className="absolute z-1 text-white left-0 bottom-0 border-gray-500 border-r-2 h-[80vh] bg-black/90 flex flex-col top-16">
                <Menu onClick={() => setClose(false)}/>
            </div>
        )
    }

    return (
        <div className={`${close ? "hidden" : "absolute"} z-1 text-white left-0 top-16 bottom-0 w-64 border-gray-500 border-r-2 h-[80vh] bg-black/90 flex flex-col ease-in-out`}>
            <div className="p-4 font-semibold text-xs tracking-wide border-b border-gray-800/60 uppercase">File Explorer</div>
            <div className=" text-sm border-b overflow-y-auto p-2 flex justify-between text-gray-300/95 uppercase">
                <p className="">Project</p>
                <p className="pr-2 cursor-pointer" onClick={() => setClose(true)}><X height={15} width={15} /></p>
            </div>
            {/* File List */}
            <div className="flex-1 overflow-y-auto p-2 text-sm pt-5 ">
                <ul className="flex flex-col text-sm">
                    <li className="text-gray-400 flex gap-2 cursor-pointer py-4 border-b border-gray-600 hover:bg-gray-300">
                        <FileBracesCorner height={18} width={18} />
                        index.html
                    </li>
                    <li className="text-gray-400 flex gap-2 cursor-pointer py-4 border-b border-gray-600 hover:bg-gray-300">
                        <FileBracesCorner height={18} width={18} />
                        style.css
                    </li>
                    <li className="text-gray-400 flex gap-2 cursor-pointer py-4 border-b border-gray-600 hover:bg-gray-300">
                        <FileBracesCorner height={18} width={18} />
                        script.js
                    </li>
                </ul>
            </div>
        </div>
        
    )
}

export default Sidebar
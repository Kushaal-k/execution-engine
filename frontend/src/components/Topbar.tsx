import type { Dispatch, SetStateAction, MouseEventHandler } from "react";

interface ITopBarProps {
    loading: boolean,
    handleSubmit: MouseEventHandler<HTMLButtonElement>,
    status: string,
    username: string,
    setUsername: Dispatch<SetStateAction<string>>
}

function Topbar({  handleSubmit, loading, status, username, setUsername } : ITopBarProps) {
    
    return (
        <div className="z-2 top-0 w-full h-16 bg-blue-900 flex items-center justify-between px-8">
            <div className="text-2xl">
                Tessera.io - Execution Engine
            </div>
            <div className="flex items-center gap-12">
            <div>
                <input
                    type="text"
                    placeholder="Enter Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border border-gray-500 px-4 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-white text-black"
                />
            </div>
            <div>
                <button 
                className="flex items-center justify-center px-8 py-2 my-4 bg-amber-400 hover:bg-amber-500 rounded disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900 transition-colors"
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
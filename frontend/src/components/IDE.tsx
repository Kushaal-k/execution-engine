import { useState, useEffect } from "react";
import { useYjsSync } from "../hooks/userYjsSync";
import MonacoEditor from "./MonacoEditor";
import Sidebar from "./Sidebar";

function IDE({
    username,
    language,
    setCode,
    setLanguage
}: {username: string, language: string, setCode?: (code: string) => void, setLanguage: (language: string) => void}) {

    const [currentFileId, setCurrentFileId] = useState<string>("");
    // const [currentFileLanguage, setCurrentFileLanguage] = useState<string>("");
    const [roomId] = useState<string>("room-1");

    const { doc, files, folders, workspaceMetadata } = useYjsSync(roomId, username);

    useEffect(() => {
        if(!currentFileId && files.length > 0) {
            setCurrentFileId(files[0].id);
        }

        const activeFile = files.find(f => f.id === currentFileId);

        if(activeFile) {
            setLanguage(activeFile.language || "javascript");
        }

    }, [currentFileId, files]);

    return (
        <div className="flex flex-row h-[80vh] w-full bg-gray-950 text-gray-100 overflow-hidden relative border-t border-gray-800">
            <Sidebar
                files={files}
                folders={folders}
                workspaceMetadata={workspaceMetadata}
                currentFileId={currentFileId}
                onSelectFile={(id) => setCurrentFileId(id)}
            />
            <div className="flex-1 h-full min-w-0">
                <MonacoEditor 
                    language={language}
                    username={username}
                    currentFileId={currentFileId}
                    doc={doc}
                    setCode={setCode}
                />
            </div>
        </div>
    );
}

export default IDE;
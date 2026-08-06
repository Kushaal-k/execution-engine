import { useState, useEffect } from "react";
import { useYjsSync } from "../hooks/userYjsSync";
import MonacoEditor from "./MonacoEditor";
import Sidebar from "./Sidebar";
import { detectLanguage } from "../utils/languageDetector";

function IDE({
    username,
    language,
    setCode,
    setLanguage
}: {username: string, language: string, setCode?: (code: string) => void, setLanguage: (language: string) => void}) {

    const [currentFileId, setCurrentFileId] = useState<string>("");
    const [roomId] = useState<string>("room-1");

    const { doc, files, folders, workspaceMetadata } = useYjsSync(roomId, username);

    useEffect(() => {
        const fileExists = files.some(f => f && f.id === currentFileId);
        if((!currentFileId || !fileExists) && files.length > 0) {
            setCurrentFileId(files[0].id);
        }

        const activeFile = files.find(f => f && f.id === currentFileId);

        if(activeFile) {
            const detected = detectLanguage(activeFile.name, activeFile.language);
            setLanguage(detected);
        }

    }, [currentFileId, files, setLanguage]);


    return (
        <div className="flex flex-row flex-1 h-full w-full bg-zinc-950 text-zinc-100 overflow-hidden relative">
            <Sidebar
                files={files}
                folders={folders}
                workspaceMetadata={workspaceMetadata}
                currentFileId={currentFileId}
                onSelectFile={(id) => setCurrentFileId(id)}
            />
            <div className="flex-1 h-full min-w-0 flex flex-col">
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
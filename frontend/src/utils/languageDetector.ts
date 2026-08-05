export function detectLanguage(fileName?: string, fallbackLanguage?: string): string {
    if (!fileName) return fallbackLanguage || "javascript";
    
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
        case "py":
            return "python";
        case "cpp":
        case "c":
        case "cc":
        case "cxx":
        case "hpp":
        case "h":
            return "cpp";
        case "js":
        case "jsx":
            return "javascript";
        case "ts":
        case "tsx":
            return "typescript";
        case "json":
            return "json";
        case "html":
            return "html";
        case "css":
            return "css";
        case "md":
            return "markdown";
        default:
            return fallbackLanguage || "javascript";
    }
}

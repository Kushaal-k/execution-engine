import type { FileMetadata, FolderMetadata } from "@execution-engine/shared";

export function resolveFilePaths(
    files: FileMetadata[],
    folders: FolderMetadata[]
): Map<string, string> {
    const folderMap = new Map<string, FolderMetadata>(folders.map((f) => [f.id, f]));
    const pathMap = new Map<string, string>();

    for (const file of files) {
        const segments: string[] = [file.name];
        let currentParentId = file.parentFolderId;

        while (currentParentId) {
            const parent = folderMap.get(currentParentId);
            if(!parent) break;

            segments.unshift(parent.name);
            currentParentId = parent.parentFolderId;
        }

        pathMap.set(file.id, segments.join('/'));
    }

    return pathMap;
}
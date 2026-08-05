import type { FileMetadata, FolderMetadata } from "@execution-engine/shared";

export interface ITreeNode {
    files: FileMetadata[];
    folders: FolderMetadata[];
}

export interface TreeNode {
    id: string;
    name: string;
    type: "file" | "folder";
    children?: TreeNode[];
}

const compareNodes = (a: TreeNode, b: TreeNode) => {
    if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
};

export function createTree({
    files,
    folders
}: ITreeNode): TreeNode[] {

    const folderMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    for(const folder of folders) {
        folderMap.set(folder.id, {
            id: folder.id,
            name: folder.name,
            type: "folder",
            children: []
        });
    }

    for (const folder of folders) {
        const node = folderMap.get(folder.id)!;

        if(folder.parentFolderId) {
            const parent = folderMap.get(folder.parentFolderId);

            if (parent) {
                parent.children!.push(node);
            }
            else {
                rootNodes.push(node);
            }
        }
        else {
            rootNodes.push(node);
        }
    }

    for (const file of files) {
        const node: TreeNode = {
            id: file.id,
            name: file.name,
            type: "file",
        }

        if(file.parentFolderId) {
            const parent = folderMap.get(file.parentFolderId);

            if(parent) {
                parent.children?.push(node);
            }
            else{
                rootNodes.push(node);
            }
        }
        else {
            rootNodes.push(node);
        }
    }

    for(const folder of folderMap.values()) {
        folder.children?.sort(compareNodes);
    }

    rootNodes.sort(compareNodes);

    return rootNodes;
}
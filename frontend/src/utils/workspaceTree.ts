import type { FileMetadata, FolderMetadata } from "@execution-engine/shared";

export interface ITreeNode {
  files?: FileMetadata[];
  folders?: FolderMetadata[];
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
  return (a.name || "").localeCompare(b.name || "");
};

export function createTree({
  files = [],
  folders = [],
}: ITreeNode = {}): TreeNode[] {
  const safeFiles = Array.isArray(files) ? files.filter(Boolean) : [];
  const safeFolders = Array.isArray(folders) ? folders.filter(Boolean) : [];

  const folderMap = new Map<string, TreeNode>();
  const rootNodes: TreeNode[] = [];

  for (const folder of safeFolders) {
    if (!folder || !folder.id) continue;
    folderMap.set(folder.id, {
      id: folder.id,
      name: folder.name || "Untitled",
      type: "folder",
      children: [],
    });
  }

  for (const folder of safeFolders) {
    if (!folder || !folder.id) continue;
    const node = folderMap.get(folder.id);
    if (!node) continue;

    if (folder.parentFolderId) {
      const parent = folderMap.get(folder.parentFolderId);
      if (parent && parent.children) {
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  }

  for (const file of safeFiles) {
    if (!file || !file.id) continue;
    const node: TreeNode = {
      id: file.id,
      name: file.name || "Untitled",
      type: "file",
    };

    if (file.parentFolderId) {
      const parent = folderMap.get(file.parentFolderId);
      if (parent && parent.children) {
        parent.children.push(node);
      } else {
        rootNodes.push(node);
      }
    } else {
      rootNodes.push(node);
    }
  }

  for (const folder of folderMap.values()) {
    if (folder.children) {
      folder.children.sort(compareNodes);
    }
  }

  rootNodes.sort(compareNodes);

  return rootNodes;
}
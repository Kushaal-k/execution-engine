Workspace
│
└── Y.Doc
     │
     ├── files (Object - FileMetaData)
     │      │
     │      ├── fileId
     │      │      ├── id
     │      │      ├── name
     │      │      ├── language
     │      │      └── parentFolderId
     │      │
     │      └── ...
     │
     ├── folders (Object - FolderMetaData)
     │      │
     │      ├── folderId
     │      │      ├── id
     │      │      ├── name
     │      │      └── parentFolderId
     │      │
     │      └── ...
     │
     │
     └── metadata (Y.Map)


class Workspace {

    createFile(...)

    deleteFile(...)

    renameFile(...)

    moveFile(...)

    getFile(...)

    getText(...)

    createFolder(...)

    deleteFolder(...)

    renameFolder(...)

    moveFolder(...)

    getFolder(...)

    getSnapshot()

    applyUpdate(...)

    encodeState()

}
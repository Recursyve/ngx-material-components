export type NiceLocalFile = {
    file: File;
    name: string;
};

export type NiceRemoteFile = {
    id: string | number;
    name: string;
    url: string;
};

export type NiceSelectedFiles = NiceLocalFile | NiceRemoteFile;

export function isLocalFile(file: NiceSelectedFiles): file is NiceLocalFile {
    return "file" in file;
}

export function isRemoteFile(file: NiceSelectedFiles): file is NiceRemoteFile {
    return "id" in file;
}

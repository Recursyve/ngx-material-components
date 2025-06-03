export type NiceFileDimensions = {
    width: number;
    height: number;
    ratio: number;
};

export type NiceLocalFile = {
    file: File;
    name: string;
    size?: number;
    dimensions?: NiceFileDimensions;
};

export type NiceRemoteFile = {
    id: string | number;
    name: string;
    url: string;
    size?: number;
};

export type NiceSelectedFiles = NiceLocalFile | NiceRemoteFile;

export function isLocalFile(file: NiceSelectedFiles): file is NiceLocalFile {
    return "file" in file;
}

export function isRemoteFile(file: NiceSelectedFiles): file is NiceRemoteFile {
    return "id" in file;
}

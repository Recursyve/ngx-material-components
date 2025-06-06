export type NiceDropzoneImageConfig = {
    minSize?: {
        width: number;
        height: number;
    };
    maxSize?: {
        width: number;
        height: number;
    };
    recommendedSize?: {
        width: number;
        height: number;
    };
};

export type NiceDropzoneFileSizeConfig = {
    size: number;
    unit: "B" | "KB" | "MB" | "GB";
};

export type NiceDropzoneTranslationKeyConfig = {
    upload: {
        file: string;
        files: string;
        image: string;
        images: string;
    };
    format: {
        label: string;
    };
    ratio: {
        label: string;
        pixels: string;
    };
    size: {
        label: string;
        units: {
            B: string;
            KB: string;
            MB: string;
            GB: string;
        };
    }
};

import { Provider } from "@angular/core";
import { NICE_DROPZONE_TRANSLATION_KEYS } from "./constant";
import { NiceDropzoneTranslationKeyConfig } from "./dropzone.config";
import { NiceDropzoneOptions } from "./options";

const defaultTranslationKeys: NiceDropzoneTranslationKeyConfig = {
    upload: {
        file: "components.dropzone.upload.file",
        files: "components.dropzone.upload.files",
        image: "components.dropzone.upload.image",
        images: "components.dropzone.upload.images"
    },
    format: {
        label: "components.dropzone.format.label"
    },
    ratio: {
        label: "components.dropzone.ratio.label",
        pixels: "components.dropzone.ratio.pixels"
    },
    size: {
        label: "components.dropzone.size.label",
        units: {
            B: "components.dropzone.size.units.B",
            KB: "components.dropzone.size.units.KB",
            MB: "components.dropzone.size.units.MB",
            GB: "components.dropzone.size.units.GB"
        }
    }
};

export function provideDropzone(options?: NiceDropzoneOptions): Provider[] {
    return [
        {
            provide: NICE_DROPZONE_TRANSLATION_KEYS,
            useValue: options?.translationKeys ?? defaultTranslationKeys
        }
    ];
}

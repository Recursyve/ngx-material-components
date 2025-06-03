import { Component, computed, inject, input, output } from "@angular/core";
import { NiceTranslatePipe } from "@recursyve/ngx-material-components/common";

import { NICE_DROPZONE_TRANSLATION_KEYS } from "../constant";
import { NiceDropzoneModes } from "../dropzone";
import { NiceDropzoneTranslationKeyConfig } from "../config";
import { isLocalFile, NiceFileDimensions, NiceSelectedFiles } from "../models";
import { FileSizePipe } from "../pipes/file-size.pipe";
import { NiceDropzoneDeleteIcon } from "../icons/delete/delete-icon.component";

@Component({
    selector: "nice-dropzone-file-preview",
    templateUrl: "./file-preview.html",
    styleUrls: ["./file-preview.scss"],
    imports: [NiceDropzoneDeleteIcon, NiceTranslatePipe, FileSizePipe],
    host: {
        style: "flex: 1 1 auto;"
    }
})
export class NiceDropzoneFilePreview {
    public readonly file = input.required<NiceSelectedFiles>();
    public readonly mode = input.required<NiceDropzoneModes>();

    protected readonly clickDelete = output<void>();

    protected readonly isImage = computed(() => this.mode() === "image");
    protected readonly imageDimensions = computed<NiceFileDimensions | null>(() => {
        const file = this.file();
        if (isLocalFile(file)) {
            return file.dimensions ?? null;
        }

        return null;
    });
    protected readonly imageUrl = computed<string>(() => {
        const file = this.file();
        if (isLocalFile(file)) {
            return URL.createObjectURL(file.file);
        }

        return file.url;
    });

    protected _translationKeys = inject<NiceDropzoneTranslationKeyConfig>(NICE_DROPZONE_TRANSLATION_KEYS);
}

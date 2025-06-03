import { inject, Pipe, PipeTransform } from "@angular/core";
import { NiceTranslater, NICE_COMPONENTS_TRANSLATER } from "@recursyve/ngx-material-components/common";

import { NICE_DROPZONE_TRANSLATION_KEYS } from "../constant";
import { NiceDropzoneTranslationKeyConfig } from "../dropzone.config";

@Pipe({
    name: "niceFileSize"
})
export class FileSizePipe implements PipeTransform {
    private readonly units = ["B", "KB", "MB", "GB"] as const;

    private readonly translater = inject<NiceTranslater>(NICE_COMPONENTS_TRANSLATER);
    private readonly translationKeys = inject<NiceDropzoneTranslationKeyConfig>(NICE_DROPZONE_TRANSLATION_KEYS);

    public transform(bytes: number | null | undefined, precision = 0): string {
        const defaultUnit = this.translater(this.translationKeys.size.units.B);

        if (!bytes) {
            return `0 ${defaultUnit}`;
        }

        const unitIndex = Math.floor(Math.log(bytes) / Math.log(1000));
        const boundedUnitIndex = Math.min(unitIndex, this.units.length - 1);

        const size = bytes / Math.pow(1000, boundedUnitIndex);

        const unit = this.translater(this.translationKeys.size.units[this.units[boundedUnitIndex]]);
        return `${size.toFixed(precision)} ${unit}`;
    }
}

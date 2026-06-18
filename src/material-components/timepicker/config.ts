import { MatFormFieldAppearance } from "@angular/material/form-field";

export type NiceTimepickerTranslationKeyConfig = {
    cancel: string;
    confirm: string;
    title: string;
};

export type NiceTimepickerConfig = {
    appearance: MatFormFieldAppearance;
    toggleIcon?: string;
    translationKeys: NiceTimepickerTranslationKeyConfig;
};

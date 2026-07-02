export type NiceTimepickerTranslationKeyConfig = {
    cancel: string;
    confirm: string;
    title: string;
};

export type NiceTimepickerConfig = {
    dottedMinutesInGap?: boolean;
    minutesGap?: number;
    toggleIcon?: string;
    /** Translation key for invalid free-text time values. */
    invalidFormatKey?: string;
    translationKeys: NiceTimepickerTranslationKeyConfig;
};

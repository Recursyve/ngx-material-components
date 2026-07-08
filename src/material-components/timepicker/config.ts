export type NiceTimepickerTranslationKeyConfig = {
    cancel: string;
    confirm: string;
    title: string;
};

export type NiceTimepickerConfig = {
    /** Default time when the field is empty. Accepts `midnight`, `noon`, 12h (`2:30 PM`) or 24h (`14:30`). */
    defaultTime?: string;
    dottedMinutesInGap?: boolean;
    minutesGap?: number;
    toggleIcon?: string;
    /** Translation key for invalid free-text time values. */
    invalidFormatKey?: string;
    translationKeys: NiceTimepickerTranslationKeyConfig;
};

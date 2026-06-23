export type NiceTimepickerTranslationKeyConfig = {
    cancel: string;
    confirm: string;
    title: string;
};

export type NiceTimepickerConfig = {
    dottedMinutesInGap?: boolean;
    minutesGap?: number;
    toggleIcon?: string;
    translationKeys: NiceTimepickerTranslationKeyConfig;
};

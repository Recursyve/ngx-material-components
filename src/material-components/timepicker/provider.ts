import { Provider } from "@angular/core";
import { NiceTimepickerConfig } from "./config";
import { NICE_TIMEPICKER_CONFIG } from "./constant";
import { NiceTimepickerOptions } from "./options";
import { DEFAULT_MINUTES_GAP } from "./time-utils";

const defaultTranslationKeys: NiceTimepickerConfig["translationKeys"] = {
    cancel: "components.timepicker.cancel",
    confirm: "components.timepicker.confirm",
    title: "components.timepicker.title"
};

const defaultConfig: NiceTimepickerConfig = {
    dottedMinutesInGap: true,
    minutesGap: DEFAULT_MINUTES_GAP,
    invalidFormatKey: "errors.timepicker.invalidFormat",
    translationKeys: defaultTranslationKeys
};

export { defaultConfig as defaultTimepickerConfig };

export function provideTimepicker(options?: NiceTimepickerOptions): Provider[] {
    return [
        {
            provide: NICE_TIMEPICKER_CONFIG,
            useValue: {
                ...defaultConfig,
                ...options?.config,
                translationKeys: {
                    ...defaultTranslationKeys,
                    ...options?.config?.translationKeys
                }
            }
        }
    ];
}

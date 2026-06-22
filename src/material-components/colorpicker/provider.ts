import { Provider } from "@angular/core";
import { NiceColorpickerConfig } from "./config";
import { NICE_COLORPICKER_CONFIG } from "./constant";
import { NiceColorpickerOptions } from "./options";

const defaultConfig: NiceColorpickerConfig = {};

export { defaultConfig as defaultColorpickerConfig };

export function provideColorpicker(options: NiceColorpickerOptions = { config: defaultConfig }): Provider[] {
    return [
        {
            provide: NICE_COLORPICKER_CONFIG,
            useValue: options.config
        }
    ];
}

import { Provider } from "@angular/core";
import { NICE_COMPONENTS_TRANSLATER } from "./translater/constant";
import { NiceTranslaterOptions } from "./translater/options";

export function provideNiceComponents(options: NiceTranslaterOptions): Provider[] {
    return [
        { 
            provide: NICE_COMPONENTS_TRANSLATER,
            ...options.translater
        }
    ];
}

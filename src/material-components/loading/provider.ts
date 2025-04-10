import { Provider } from "@angular/core";
import { NiceLoadingOptions } from "./options";
import { NICE_LOADING_OPTIONS } from "./constant";

export function provideNiceLoadingOptions(options: NiceLoadingOptions): Provider {
    return {
        provide: NICE_LOADING_OPTIONS,
        useValue: options
    };
}

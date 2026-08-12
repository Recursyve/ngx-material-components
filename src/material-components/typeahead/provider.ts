import { Provider, Type } from "@angular/core";
import { NiceTypeaheadConfig } from "./config";
import { NICE_ASYNC_TYPEAHEAD_RESOURCES_PROVIDER, NICE_TYPEAHEAD_CONFIG } from "./constants";
import { NiceAsyncTypeaheadResourceProvider } from "./providers/async-typeahead.provider";

export type NiceTypeaheadOptions = {
    config?: NiceTypeaheadConfig;
};

export function provideTypeahead(options?: NiceTypeaheadOptions): Provider[] {
    return [
        {
            provide: NICE_TYPEAHEAD_CONFIG,
            useValue: options?.config ?? {}
        }
    ];
}

export function provideAsyncTypeaheadResources(
    providers: Type<NiceAsyncTypeaheadResourceProvider<unknown, unknown>>[]
): Provider[] {
    return providers.map((provider) => ({
        provide: NICE_ASYNC_TYPEAHEAD_RESOURCES_PROVIDER,
        useClass: provider,
        multi: true
    }));
}

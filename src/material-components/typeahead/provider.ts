import { Provider, Type } from "@angular/core";
import { NICE_ASYNC_TYPEAHEAD_RESOURCES_PROVIDER } from "./async-typeahead.constant";
import { NiceAsyncTypeaheadResourceProvider } from "./providers/async-typeahead.provider";

export function provideAsyncTypeaheadResources(
    providers: Type<NiceAsyncTypeaheadResourceProvider<unknown, unknown>>[]
): Provider[] {
    return providers.map((provider) => ({
        provide: NICE_ASYNC_TYPEAHEAD_RESOURCES_PROVIDER,
        useClass: provider,
        multi: true
    }));
}

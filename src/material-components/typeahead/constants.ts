import { InjectionToken } from "@angular/core";
import { NiceTypeaheadConfig } from "./config";

export const NICE_ASYNC_TYPEAHEAD_RESOURCES_PROVIDER = new InjectionToken("nice_async_typeahead_provider");

export const NICE_TYPEAHEAD_CONFIG = new InjectionToken<NiceTypeaheadConfig>("nice_typeahead_config");

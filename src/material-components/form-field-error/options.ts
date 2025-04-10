import { FactoryProvider } from "@angular/core";
import { ErrorTranslater } from "./error-translater";
import { ErrorTransformers } from "./error-transformer";

export type NiceFormFieldErrorsOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    translater: Omit<FactoryProvider, "provide" | "multi"> & { useFactory: (...args: any[]) => ErrorTranslater };
    errorTransformers?: ErrorTransformers;
};

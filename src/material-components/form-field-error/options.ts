import { FactoryProvider } from "@angular/core";
import { NiceTranslater } from "@recursyve/ngx-material-components/common";
import { ErrorTransformers } from "./error-transformer";

export type NiceFormFieldErrorsOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    translater: Omit<FactoryProvider, "provide" | "multi"> & { useFactory: (...args: any[]) => NiceTranslater };
    errorTransformers?: ErrorTransformers;
    signalErrorTransformers?: ErrorTransformers;
};

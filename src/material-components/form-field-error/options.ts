import { FactoryProvider } from "@angular/core";
import { NiceTranslater } from "@recursyve/ngx-material-components/common";
import { ErrorTransformers } from "./error-transformer";

export type NiceFormFieldErrorsOptions = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    translater: Omit<FactoryProvider, "provide" | "multi"> & { useFactory: (...args: any[]) => NiceTranslater };
    /**
     * Transformers keyed by reactive form error name (e.g. `minlength`, `pattern`).
     * Also used by signal forms when the `kind` matches or maps to the same key.
     */
    errorTransformers?: ErrorTransformers;
    /**
     * Transformers keyed by signal form error `kind` (e.g. `minLength`, `reserved`).
     * Takes priority over built-in signal-to-reactive conversion when no `message` is set
     * on the validation error.
     */
    signalErrorTransformers?: ErrorTransformers;
};

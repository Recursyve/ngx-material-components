import { Provider } from "@angular/core";
import { NICE_FORM_FIELD_ERROR_TRANSFORMERS, NICE_FORM_FIELD_ERROR_TRANSLATER } from "./constant";
import { NiceFormFieldErrorsOptions } from "./options";
import { DefaultErrorTransformers } from "./error-transformer";

export function provideFormFieldError(options: NiceFormFieldErrorsOptions): Provider[] {
    return [
        {
            provide: NICE_FORM_FIELD_ERROR_TRANSFORMERS,
            useValue: {
                ...DefaultErrorTransformers,
                ...options.errorTransformers
            }
        },
        {
            provide: NICE_FORM_FIELD_ERROR_TRANSLATER,
            ...options.translater
        }
    ];
}

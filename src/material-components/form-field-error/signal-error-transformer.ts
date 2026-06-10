import { ValidationError } from "@angular/forms/signals";
import { ValidationErrors } from "@angular/forms";

import { DefaultErrorTransformers, ErrorTransformers } from "./error-transformer";

const SIGNAL_TO_REACTIVE_ERROR_KEY: Record<string, string> = {
    minLength: "minlength",
    maxLength: "maxlength"
};

function signalErrorToValidationErrors(error: ValidationError.WithFieldTree): ValidationErrors {
    const details = error as ValidationErrors;

    switch (error.kind) {
        case "minLength":
            return { requiredLength: details["minLength"] };
        case "maxLength":
            return { requiredLength: details["maxLength"] };
        case "pattern":
            return { requiredPattern: String(details["pattern"] ?? "") };
        default:
            return details;
    }
}

export const SignalDefaultErrorTransformers: ErrorTransformers = {
    ...DefaultErrorTransformers,
    minLength: (_, details) => DefaultErrorTransformers["minlength"]("minlength", details),
    maxLength: (_, details) => DefaultErrorTransformers["maxlength"]("maxlength", details)
};

export function resolveSignalFormError(
    error: ValidationError.WithFieldTree,
    transformers: ErrorTransformers
): { text: string; params: Record<string, string>; direct?: boolean } {
    if (error.message) {
        return { text: error.message, params: {}, direct: true };
    }

    const reactiveKey = SIGNAL_TO_REACTIVE_ERROR_KEY[error.kind] ?? error.kind;
    const hasCustomTransformer = Object.hasOwn(transformers, error.kind);
    const transformer = hasCustomTransformer
        ? transformers[error.kind]
        : transformers[reactiveKey];

    if (!transformer) {
        return { text: `errors.${reactiveKey}`, params: {} };
    }

    const details = hasCustomTransformer
        ? (error as ValidationErrors)
        : signalErrorToValidationErrors(error);

    if (typeof details !== "object") {
        return { text: `errors.${reactiveKey}`, params: {} };
    }

    const { key, params } = transformer(reactiveKey, details);
    return { text: `errors.${key}`, params: (params ?? {}) as Record<string, string> };
}

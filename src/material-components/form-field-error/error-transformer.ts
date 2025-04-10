import { ValidationErrors } from "@angular/forms";

export type TransformedError = { key: string; params?: Record<string, string> };
export type ErrorTransformer = (error: string, details: ValidationErrors) => TransformedError;
export type ErrorTransformers = Record<string, ErrorTransformer>;

export const PatternErrorTransformer: ErrorTransformer = (error: string, details: ValidationErrors) => {
    if (details["requiredPattern"]) {
        return {
            key: details["requiredPattern"]
        }
    }

    return { key: error };
};

export const MaskErrorTransformer: ErrorTransformer = (error: string, details: ValidationErrors) => {
    if (details["requiredMask"]) {
        return {
            key: details["requiredMask"]
        }
    }

    return { key: error };
};

export const LengthErrorTransformer: ErrorTransformer = (error: string, details: ValidationErrors) => {
    return {
        key: error,
        params: {
            value: details["requiredLength"]
        }
    };
};

export const MinErrorTransformer: ErrorTransformer = (error: string, details: ValidationErrors) => {
    return {
        key: error,
        params: {
            min: details["min"],
            actual: details["actual"]
        }
    };
};

export const MaxErrorTransformer: ErrorTransformer = (error: string, details: ValidationErrors) => {
    return {
        key: error,
        params: {
            max: details["max"],
            actual: details["actual"]
        }
    };
};

export const DefaultErrorTransformers: ErrorTransformers = {
    pattern: PatternErrorTransformer,
    mask: MaskErrorTransformer,
    minlength: LengthErrorTransformer,
    maxlength: LengthErrorTransformer,
    min: MinErrorTransformer,
    max: MaxErrorTransformer
};

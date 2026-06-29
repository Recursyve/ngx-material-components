import { validate, type FieldTree, type SchemaPath } from "@angular/forms/signals";
import { TinyColor } from "@ctrl/tinycolor";

const registeredFields = new WeakSet<object>();

export const NICE_COLOR_PARSE_ERROR_KIND = "parse";

export function isValidNiceColor(value: string | null | undefined): boolean {
    const normalized = value?.trim();

    if (!normalized) {
        return true;
    }

    return new TinyColor(normalized).isValid;
}

export function normalizeNiceColor(value: string): string | null {
    const normalized = value.trim();

    if (!normalized) {
        return null;
    }

    const color = new TinyColor(normalized);

    return color.isValid ? color.toHexString() : null;
}

export function niceColorFormat(path: FieldTree<string> | SchemaPath<string>, message: string): void {
    validate(path as SchemaPath<string>, ({ value }) => {
        const current = value()?.trim() ?? "";

        if (!current || isValidNiceColor(current)) {
            return undefined;
        }

        return { kind: NICE_COLOR_PARSE_ERROR_KIND, message };
    });
}

export function registerNiceColorFormatValidation(field: FieldTree<string>, message: string): void {
    if (registeredFields.has(field)) {
        return;
    }

    registeredFields.add(field);
    niceColorFormat(field, message);
}

/** @deprecated Use {@link niceColorFormat} in the `form()` schema callback instead. */
export const registerNiceColorpickerValidation = registerNiceColorFormatValidation;

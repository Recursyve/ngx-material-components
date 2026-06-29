import { validate, type FieldTree, type SchemaPath } from "@angular/forms/signals";
import { formatTime, parseTime } from "./time-utils";

const registeredFields = new WeakSet<object>();

export const NICE_TIME_PARSE_ERROR_KIND = "parse";

export function isValidNiceTime(value: string | null | undefined): boolean {
    const normalized = value?.trim();

    if (!normalized) {
        return true;
    }

    return parseTime(normalized) !== null;
}

export function normalizeNiceTime(value: string): string | null {
    const parsed = parseTime(value);

    return parsed ? formatTime(parsed) : null;
}

export function niceTimeFormat(path: FieldTree<string> | SchemaPath<string>, message: string): void {
    validate(path as SchemaPath<string>, ({ value }) => {
        const current = value()?.trim() ?? "";

        if (!current || isValidNiceTime(current)) {
            return undefined;
        }

        return { kind: NICE_TIME_PARSE_ERROR_KIND, message };
    });
}

export function registerNiceTimeFormatValidation(field: FieldTree<string>, message: string): void {
    if (registeredFields.has(field)) {
        return;
    }

    registeredFields.add(field);
    niceTimeFormat(field, message);
}

import type { FieldState } from "@angular/forms/signals";

import { isValidNiceTime } from "./time-format-validation";

export function hasNiceTimeFormatError(value: string | null | undefined): boolean {
    const normalized = value?.trim() ?? "";

    return normalized !== "" && !isValidNiceTime(normalized);
}

export function niceTimeFieldErrorState(state: FieldState<string>): boolean {
    if (!state.touched()) {
        return false;
    }

    if (hasNiceTimeFormatError(state.value())) {
        return true;
    }

    return state.invalid();
}

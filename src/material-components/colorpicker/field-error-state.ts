import type { FieldState } from "@angular/forms/signals";

import { isValidNiceColor } from "./color-validation";

export function hasNiceColorFormatError(value: string | null | undefined): boolean {
    const normalized = value?.trim() ?? "";

    return normalized !== "" && !isValidNiceColor(normalized);
}

export function niceColorFieldErrorState(state: FieldState<string>): boolean {
    if (!state.touched() && !state.dirty()) {
        return false;
    }

    if (hasNiceColorFormatError(state.value())) {
        return true;
    }

    return state.invalid();
}

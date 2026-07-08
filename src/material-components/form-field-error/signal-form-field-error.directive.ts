import { contentChild, Directive, effect, ElementRef, inject, input, ViewContainerRef } from "@angular/core";
import { Field, FormField } from "@angular/forms/signals";
import { MatFormField } from "@angular/material/form-field";
import { NiceTranslater } from "@recursyve/ngx-material-components/common";

import { NICE_FORM_FIELD_ERROR_TRANSFORMERS, NICE_FORM_FIELD_ERROR_TRANSLATER } from "./constant";
import { ErrorTransformers } from "./error-transformer";
import { FormFieldErrorDisplay } from "./form-field-error-display";
import { resolveSignalFormError, SignalDefaultErrorTransformers } from "./signal-error-transformer";

@Directive({ selector: "[niceSignalFormFieldError]", standalone: true })
export class NiceSignalFormFieldErrorDirective {
    private readonly elementRef = inject(ElementRef<HTMLElement>);
    private readonly formField = inject(MatFormField);
    private readonly transformers = inject<ErrorTransformers>(NICE_FORM_FIELD_ERROR_TRANSFORMERS);
    private readonly translater = inject<NiceTranslater>(NICE_FORM_FIELD_ERROR_TRANSLATER);
    private readonly viewContainerRef = inject(ViewContainerRef);

    /**
     * The signal form field to watch. When omitted, the directive resolves the `[formField]`
     * binding from a descendant control inside the `mat-form-field`.
     */
    public readonly field = input<Field<unknown>>();

    private readonly formFieldDirective = contentChild(FormField, { descendants: true });
    private readonly display = new FormFieldErrorDisplay(this.elementRef, this.viewContainerRef, this.translater);
    private readonly signalTransformers: ErrorTransformers = {
        ...SignalDefaultErrorTransformers,
        ...this.transformers
    };

    constructor() {
        effect(() => {
            const state = this.resolveFieldState();
            if (state === null || state.pending()) {
                return;
            }

            if (state.valid() || (!state.touched() && !state.dirty())) {
                this.display.setError("", {});
                return;
            }

            for (const error of this.resolveErrors(state.errors())) {
                const resolved = resolveSignalFormError(error, this.signalTransformers);

                if (resolved.direct) {
                    this.display.setErrorText(resolved.text);
                    continue;
                }

                this.display.setError(resolved.text, resolved.params);
            }
        });
    }

    private resolveFieldState() {
        const fieldInput = this.field();
        if (fieldInput) {
            return fieldInput();
        }

        const formFieldDirective = this.formFieldDirective();
        if (formFieldDirective) {
            return formFieldDirective.state();
        }

        const ngControl = this.formField._control?.ngControl as { field?: Field<unknown> } | null;
        if (ngControl?.field) {
            return ngControl.field();
        }

        return null;
    }

    private resolveErrors(stateErrors: ReturnType<ReturnType<Field<unknown>>["errors"]>) {
        const formFieldDirective = this.formFieldDirective();
        if (formFieldDirective) {
            const directiveErrors = formFieldDirective.errors();
            return directiveErrors.length > 0 ? directiveErrors : stateErrors;
        }

        return stateErrors;
    }
}

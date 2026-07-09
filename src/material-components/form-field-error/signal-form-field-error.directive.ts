import {
    afterRenderEffect,
    contentChild,
    Directive,
    effect,
    ElementRef,
    inject,
    input,
    signal,
    untracked,
    ViewContainerRef
} from "@angular/core";
import { Field, FormField } from "@angular/forms/signals";
import { MatFormField, MatFormFieldControl } from "@angular/material/form-field";
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
     * The signal form field to watch. When omitted, the directive resolves the field from a
     * descendant `[formField]` or from `mat-form-field._control.field` (e.g. `nice-timepicker`).
     */
    public readonly field = input<Field<unknown>>();

    private readonly formFieldDirective = contentChild(FormField, { descendants: true });
    private readonly controlStateVersion = signal(0);
    private watchedControl: MatFormFieldControl<unknown> | null = null;
    private readonly display = new FormFieldErrorDisplay(this.elementRef, this.viewContainerRef, this.translater);
    private readonly signalTransformers: ErrorTransformers = {
        ...SignalDefaultErrorTransformers,
        ...this.transformers
    };

    constructor() {
        effect(() => {
            this.formFieldDirective();
            untracked(() => this.controlStateVersion.update((version) => version + 1));
        });

        afterRenderEffect((onCleanup) => {
            const control = this.formField._control as MatFormFieldControl<unknown> | null;

            if (control !== this.watchedControl) {
                this.watchedControl = control;
                if (control) {
                    untracked(() => this.controlStateVersion.update((version) => version + 1));
                }
            }

            if (!control?.stateChanges) {
                return;
            }

            const subscription = control.stateChanges.subscribe(() => {
                untracked(() => this.controlStateVersion.update((version) => version + 1));
            });

            onCleanup(() => subscription.unsubscribe());
        });

        effect(() => {
            this.controlStateVersion();
            this.field();
            this.updateErrorDisplay();
        });
    }

    private updateErrorDisplay(): void {
        const state = this.resolveFieldState();
        if (state === null || state.pending()) {
            return;
        }

        if (state.valid() || !state.touched()) {
            this.display.setError("", {});
            return;
        }

        for (const error of state.errors()) {
            const resolved = resolveSignalFormError(error, this.signalTransformers);

            if (resolved.direct) {
                this.display.setErrorText(resolved.text);
                continue;
            }

            this.display.setError(resolved.text, resolved.params);
        }
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

        const control = this.formField._control as { field?: () => Field<unknown> } | null;
        if (control?.field) {
            const field = control.field();
            if (field) {
                return field();
            }
        }

        return null;
    }
}

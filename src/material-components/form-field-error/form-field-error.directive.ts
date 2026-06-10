import {
    AfterViewInit,
    DestroyRef,
    Directive,
    ElementRef,
    inject,
    ViewContainerRef
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { AbstractControlDirective, NgControl } from "@angular/forms";
import { MatFormField } from "@angular/material/form-field";
import { NiceTranslater } from "@recursyve/ngx-material-components/common";
import { combineLatest, startWith } from "rxjs";

import { ErrorTransformers } from "./error-transformer";
import { NICE_FORM_FIELD_ERROR_TRANSFORMERS, NICE_FORM_FIELD_ERROR_TRANSLATER } from "./constant";
import { FormFieldErrorDisplay } from "./form-field-error-display";

@Directive({ selector: "[niceFormFieldError]", standalone: true })
export class NiceFormFieldErrorDirective implements AfterViewInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly elementRef = inject(ElementRef);
    private readonly viewContainerRef = inject(ViewContainerRef);
    private readonly formField = inject(MatFormField);
    private readonly transformers = inject<ErrorTransformers>(NICE_FORM_FIELD_ERROR_TRANSFORMERS);
    private readonly translater = inject<NiceTranslater>(NICE_FORM_FIELD_ERROR_TRANSLATER);

    private readonly display = new FormFieldErrorDisplay(this.elementRef, this.viewContainerRef, this.translater);
    private control: NgControl | AbstractControlDirective | null = null;

    public onChange = () => {
        if (this.control === null || this.control.pending) {
            return;
        }

        if (this.control.valid || this.control.untouched) {
            this.display.setError("", {});
            return;
        }

        for (const error in this.control.errors) {
            const details = this.control.errors[error];
            if (typeof details !== "object") {
                this.display.setError(`errors.${error}`, {});
                continue;
            }

            const transformer = this.transformers[error];
            if (!transformer) {
                this.display.setError(`errors.${error}`, {});
                continue;
            }

            const { key, params } = transformer(error, details);
            this.display.setError(`errors.${key}`, params ?? {});
        }
    }

    public ngAfterViewInit(): void {
        this.control = this.formField._control.ngControl;

        if (this.control !== null && this.control.statusChanges !== null) {
            combineLatest([
                this.formField._control.stateChanges,
                this.control.statusChanges.pipe(startWith(this.control.status))
            ])
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe(() => this.onChange());
        }
    }

}

import {
    AfterViewInit,
    ComponentRef,
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

import { NiceFormErrorComponent } from "./form-field-error";
import { ErrorTransformers } from "./error-transformer";
import { NICE_FORM_FIELD_ERROR_TRANSFORMERS, NICE_FORM_FIELD_ERROR_TRANSLATER } from "./constant";

@Directive({ selector: "[niceFormFieldError]", standalone: true })
export class NiceFormFieldErrorDirective implements AfterViewInit {
    private readonly destroyRef = inject(DestroyRef);
    private readonly elementRef = inject(ElementRef);
    private readonly viewContainerRef = inject(ViewContainerRef);
    private readonly formField = inject(MatFormField);
    private readonly transformers = inject<ErrorTransformers>(NICE_FORM_FIELD_ERROR_TRANSFORMERS);
    private readonly translater = inject<NiceTranslater>(NICE_FORM_FIELD_ERROR_TRANSLATER);

    private ref: ComponentRef<NiceFormErrorComponent> | null = null ;
    private control: NgControl | AbstractControlDirective | null = null;

    public onChange = () => {
        if (this.control === null || this.control.pending) {
            return;
        }

        if (this.control.valid || this.control.untouched) {
            this.setError("", {});
            return;
        }

        for (const error in this.control.errors) {
            const details = this.control.errors[error];
            if (typeof details !== "object") {
                this.setError(`errors.${error}`, {});
                continue;
            }

            const transformer = this.transformers[error];
            if (!transformer) {
                this.setError(`errors.${error}`, {});
                continue;
            }

            const { key, params } = transformer(error, details);
            this.setError(`errors.${key}`, params ?? {});
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

    public setError(text: string, params: Record<string, string>): void {
        if (!this.ref) {
            this.ref = this.viewContainerRef.createComponent(NiceFormErrorComponent);
            if (this.elementRef.nativeElement.getElementsByClassName("mat-mdc-form-field-subscript-wrapper").item(0)) {
                const hint = this.elementRef.nativeElement.getElementsByClassName("mat-mdc-form-field-hint").item(0);
                (this.ref.location.nativeElement as HTMLDivElement).style.position = "absolute";
                (this.ref.location.nativeElement as HTMLDivElement).style.top = hint ? "16px" : "0";

                const wrapper = this.elementRef.nativeElement
                    .getElementsByClassName("mat-mdc-form-field-subscript-wrapper")
                    .item(0);
                if (hint) {
                    wrapper.classList.add("override-height");
                }

                wrapper.prepend(this.ref.location.nativeElement);
            }
        }

        if (text) {
            this.elementRef.nativeElement.classList.add("form-error-show");
        } else {
            this.elementRef.nativeElement.classList.remove("form-error-show");
        }

        this.ref.instance.error = text.length > 0 ? this.translater(text, params) : text;
    }
}

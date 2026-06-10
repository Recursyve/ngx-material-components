import { ComponentRef, ElementRef, ViewContainerRef } from "@angular/core";
import { NiceTranslater } from "@recursyve/ngx-material-components/common";

import { NiceFormErrorComponent } from "./form-field-error";

export class FormFieldErrorDisplay {
    private ref: ComponentRef<NiceFormErrorComponent> | null = null;

    constructor(
        private readonly elementRef: ElementRef<HTMLElement>,
        private readonly viewContainerRef: ViewContainerRef,
        private readonly translater: NiceTranslater
    ) {}

    public setError(text: string, params: Record<string, string>): void {
        this.ensureComponent();

        if (text) {
            this.elementRef.nativeElement.classList.add("form-error-show");
        } else {
            this.elementRef.nativeElement.classList.remove("form-error-show");
        }

        this.ref!.instance.error = text.length > 0 ? this.translater(text, params) : text;
    }

    public setErrorText(text: string): void {
        this.ensureComponent();

        if (text) {
            this.elementRef.nativeElement.classList.add("form-error-show");
        } else {
            this.elementRef.nativeElement.classList.remove("form-error-show");
        }

        this.ref!.instance.error = text;
    }

    private ensureComponent(): void {
        if (this.ref) {
            return;
        }

        this.ref = this.viewContainerRef.createComponent(NiceFormErrorComponent);
        const wrapper = this.elementRef.nativeElement
            .getElementsByClassName("mat-mdc-form-field-subscript-wrapper")
            .item(0);

        if (!wrapper) {
            return;
        }

        const hint = this.elementRef.nativeElement.getElementsByClassName("mat-mdc-form-field-hint").item(0);
        (this.ref.location.nativeElement as HTMLDivElement).style.position = "absolute";
        (this.ref.location.nativeElement as HTMLDivElement).style.top = hint ? "16px" : "0";

        if (hint) {
            wrapper.classList.add("override-height");
        }

        wrapper.prepend(this.ref.location.nativeElement);
    }
}

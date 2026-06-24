import type { ElementRef } from "@angular/core";
import { Component, effect, input, signal, untracked, viewChild, ViewEncapsulation } from "@angular/core";
import type { FieldTree } from "@angular/forms/signals";
import { FormField } from "@angular/forms/signals";
import { MatFormFieldControl } from "@angular/material/form-field";
import { Subject } from "rxjs";

@Component({
    selector: "nice-timepicker",
    imports: [FormField],
    templateUrl: "./timepicker.html",
    styleUrl: "./timepicker.scss",
    encapsulation: ViewEncapsulation.None,
    providers: [{ provide: MatFormFieldControl, useExisting: NiceTimepicker }],
    host: {
        class: "nice-timepicker",
        "[class.nice-timepicker--focused]": "focused",
        "[class.nice-timepicker--empty]": "empty",
        "[id]": "id"
    }
})
export class NiceTimepicker implements MatFormFieldControl<string> {
    private static nextId = 0;

    public readonly field = input.required<FieldTree<string>>();

    public readonly id = `nice-timepicker-${NiceTimepicker.nextId++}`;
    public readonly controlType = "nice-timepicker";
    public readonly stateChanges = new Subject<void>();
    public readonly ngControl = null;
    public readonly placeholder = "";
    public readonly required = false;

    private readonly textInput = viewChild<ElementRef<HTMLInputElement>>("textInput");

    protected readonly isInputFocused = signal(false);

    public get value(): string | null {
        return this.field()().value() || null;
    }

    public get focused(): boolean {
        return this.isInputFocused();
    }

    public get empty(): boolean {
        return !this.field()().value()?.trim();
    }

    public get shouldLabelFloat(): boolean {
        return this.focused || !this.empty;
    }

    public get disabled(): boolean {
        return this.field()().disabled();
    }

    public get errorState(): boolean {
        const state = this.field()();
        return state.invalid() && state.touched();
    }

    constructor() {
        effect(() => {
            const state = this.field()();
            state.value();
            state.disabled();
            state.invalid();
            state.touched();
            this.isInputFocused();

            untracked(() => this.stateChanges.next());
        });
    }

    public setDescribedByIds(ids: string[]): void {
        const input = this.textInput()?.nativeElement;
        if (!input) {
            return;
        }

        if (ids.length) {
            input.setAttribute("aria-describedby", ids.join(" "));
        } else {
            input.removeAttribute("aria-describedby");
        }
    }

    public onContainerClick(): void {
        if (this.disabled) {
            return;
        }

        this.textInput()?.nativeElement.focus();
    }
}

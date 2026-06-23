import type { ElementRef } from "@angular/core";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    DestroyRef,
    effect,
    inject,
    input,
    signal,
    untracked,
    viewChild,
    ViewEncapsulation
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FieldTree } from "@angular/forms/signals";
import { FormField } from "@angular/forms/signals";
import { MatIconButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { Subject } from "rxjs";
import { NICE_TIMEPICKER_CONFIG } from "./constant";
import { NiceTimepickerDialog } from "./timepicker-dialog";

@Component({
    selector: "nice-timepicker",
    imports: [FormField, MatIcon, MatIconButton],
    templateUrl: "./timepicker.html",
    styleUrl: "./timepicker.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
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

    private readonly config = inject(NICE_TIMEPICKER_CONFIG);
    private readonly dialog = inject(MatDialog);
    private readonly destroyRef = inject(DestroyRef);

    public readonly field = input.required<FieldTree<string>>();

    public readonly id = `nice-timepicker-${NiceTimepicker.nextId++}`;
    public readonly controlType = "nice-timepicker";
    public readonly stateChanges = new Subject<void>();
    public readonly ngControl = null;
    public readonly placeholder = "";
    public readonly required = false;

    private readonly textInput = viewChild<ElementRef<HTMLInputElement>>("textInput");

    protected readonly isInputFocused = signal(false);
    protected readonly toggleIcon = this.config.toggleIcon;
    protected readonly translationKeys = this.config.translationKeys;

    protected readonly isDisabled = computed(() => this.field()().disabled());

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

    protected openPicker(event: MouseEvent): void {
        event.stopPropagation();

        if (this.isDisabled()) {
            return;
        }

        const dialogRef = this.dialog.open(NiceTimepickerDialog, {
            panelClass: "nice-timepicker-dialog",
            data: {
                time: this.field()().value() || "",
                titleKey: this.translationKeys.title,
                cancelKey: this.translationKeys.cancel,
                confirmKey: this.translationKeys.confirm,
                minutesGap: this.config.minutesGap ?? 5,
                dottedMinutesInGap: this.config.dottedMinutesInGap ?? true
            }
        });

        dialogRef
            .afterClosed()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((time) => {
                if (time !== undefined) {
                    this.field()().value.set(time);
                }
            });
    }
}

import { Component, computed, DestroyRef, inject, input, ViewEncapsulation } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { FieldTree } from "@angular/forms/signals";
import { MatIconButton } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { NICE_TIMEPICKER_CONFIG } from "./constant";
import { NiceTimepickerDialog } from "./timepicker-dialog";

@Component({
    selector: "nice-timepicker-toggle",
    imports: [MatIcon, MatIconButton],
    templateUrl: "./timepicker-toggle.html",
    styleUrl: "./timepicker-toggle.scss",
    encapsulation: ViewEncapsulation.None,
    host: {
        class: "nice-timepicker-toggle"
    }
})
export class NiceTimepickerToggle {
    private readonly config = inject(NICE_TIMEPICKER_CONFIG);
    private readonly dialog = inject(MatDialog);
    private readonly destroyRef = inject(DestroyRef);

    public readonly field = input.required<FieldTree<string>>();

    protected readonly toggleIcon = this.config.toggleIcon;
    protected readonly translationKeys = this.config.translationKeys;

    protected readonly isDisabled = computed(() => this.field()().disabled());

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

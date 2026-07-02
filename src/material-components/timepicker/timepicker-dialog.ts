import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatToolbar } from "@angular/material/toolbar";
import { NiceTranslatePipe } from "@recursyve/ngx-material-components/common";

import type { ClockFaceOption, ParsedTime, TimePeriod } from "./time-utils";
import { formatTime, getHourFaceOptions, getMinuteFaceOptions, resolveTime } from "./time-utils";
import { NiceTimepickerFace } from "./timepicker-face";

export type NiceTimepickerDialogData = {
    cancelKey: string;
    confirmKey: string;
    dottedMinutesInGap: boolean;
    minutesGap: number;
    time: string;
    titleKey: string;
};

type ActiveUnit = "hour" | "minute";

@Component({
    selector: "nice-timepicker-dialog",
    imports: [MatDialogModule, MatToolbar, MatButton, NiceTimepickerFace, NiceTranslatePipe],
    templateUrl: "./timepicker-dialog.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NiceTimepickerDialog {
    private readonly dialogRef = inject(MatDialogRef<NiceTimepickerDialog, string | undefined>);
    protected readonly data = inject<NiceTimepickerDialogData>(MAT_DIALOG_DATA);

    private readonly parsedTime = resolveTime(this.data.time);

    protected readonly activeUnit = signal<ActiveUnit>("hour");
    protected readonly hour = signal(this.parsedTime.hour);
    protected readonly minute = signal(this.parsedTime.minute);
    protected readonly period = signal<TimePeriod>(this.parsedTime.period);

    protected readonly selectedHour = computed(() => this.hour().toString().padStart(2, "0"));
    protected readonly selectedMinute = computed(() => this.minute().toString().padStart(2, "0"));
    protected readonly selectedPeriod = computed(() => this.period());

    protected readonly faceOptions = computed((): ClockFaceOption[] => {
        if (this.activeUnit() === "hour") {
            return getHourFaceOptions();
        }

        return getMinuteFaceOptions(this.data.minutesGap);
    });

    protected cancel(): void {
        this.dialogRef.close();
    }

    protected confirm(): void {
        const time: ParsedTime = {
            hour: this.hour(),
            minute: this.minute(),
            period: this.period()
        };

        this.dialogRef.close(formatTime(time));
    }

    protected onFaceTimeChange(value: number): void {
        if (this.activeUnit() === "hour") {
            this.hour.set(value);
            return;
        }

        this.minute.set(value);
    }

    protected onFaceTimeSelected(value: number): void {
        this.onFaceTimeChange(value);

        if (this.activeUnit() === "hour") {
            this.activeUnit.set("minute");
        }
    }

    protected setActiveUnit(unit: ActiveUnit): void {
        this.activeUnit.set(unit);
    }

    protected setPeriod(period: TimePeriod): void {
        this.period.set(period);
    }
}

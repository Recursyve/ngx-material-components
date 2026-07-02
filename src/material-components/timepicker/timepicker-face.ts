import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
    HostListener,
    input,
    output,
    viewChild,
    ViewEncapsulation
} from "@angular/core";
import { MatMiniFabButton } from "@angular/material/button";
import { MatToolbar } from "@angular/material/toolbar";

import { ClockFaceOption, DEFAULT_MINUTES_GAP, getMinuteLabelGap, isMinuteLabelVisible } from "./time-utils";

type TimepickerFaceUnit = "hour" | "minute";

function roundAngle(angle: number, step: number): number {
    return Math.round(angle / step) * step;
}

function countAngleByCords(x0: number, y0: number, x: number, y: number, currentAngle: number): number {
    if (y > y0 && x >= x0) {
        return 180 - currentAngle;
    }

    if (y > y0 && x < x0) {
        return 180 + currentAngle;
    }

    if (y < y0 && x < x0) {
        return 360 - currentAngle;
    }

    return currentAngle;
}

@Component({
    selector: "nice-timepicker-face",
    imports: [MatMiniFabButton, MatToolbar],
    templateUrl: "./timepicker-face.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class NiceTimepickerFace implements AfterViewInit {
    public readonly dottedMinutesInGap = input(true);
    public readonly faceTime = input.required<ClockFaceOption[]>();
    public readonly minutesGap = input(DEFAULT_MINUTES_GAP);
    public readonly selectedValue = input.required<number>();
    public readonly unit = input.required<TimepickerFaceUnit>();

    public readonly timeChange = output<number>();
    public readonly timeSelected = output<number>();

    private readonly clockFace = viewChild.required<ElementRef<HTMLElement>>("clockFace");

    private isDragging = false;
    private touchEndHandler?: (event: Event) => void;
    private touchStartHandler?: (event: Event) => void;

    protected readonly selectedTime = computed(() => {
        const match = this.faceTime().find((time) => time.value === this.selectedValue());

        if (match) {
            return match;
        }

        const fallbackAngle = this.unit() === "hour" ? 30 * this.selectedValue() : 6 * this.selectedValue();

        return {
            value: this.selectedValue(),
            angle: fallbackAngle === 0 ? 360 : fallbackAngle
        };
    });

    protected readonly showSelectionFab = computed(() => {
        if (this.unit() !== "minute") {
            return false;
        }

        const labelGap = getMinuteLabelGap(this.minutesGap(), this.dottedMinutesInGap());

        return !isMinuteLabelVisible(this.selectedValue(), labelGap);
    });

    private static readonly FAB_OVERLAP_THRESHOLD_DEG = 13;

    protected readonly optionsUnderFab = computed(() => {
        const result = new Set<number>();

        console.log("TTTT");
        if (!this.showSelectionFab()) {
            return result;
        }

        const fabAngle = this.selectedTime().angle;

        for (const option of this.faceTime()) {
            let diff = Math.abs(fabAngle - option.angle);
            if (diff > 180) {
                diff = 360 - diff;
            }
            if (diff <= NiceTimepickerFace.FAB_OVERLAP_THRESHOLD_DEG) {
                result.add(option.value);
            }
        }

        return result;
    });

    public ngAfterViewInit(): void {
        this.addTouchEvents();
    }

    @HostListener("mousedown", ["$event"])
    protected onMouseDown(event: MouseEvent): void {
        event.preventDefault();
        this.isDragging = true;
    }

    @HostListener("mouseup", ["$event"])
    protected onMouseUp(event: MouseEvent): void {
        event.preventDefault();
        this.isDragging = false;
    }

    @HostListener("click", ["$event"])
    @HostListener("mousemove", ["$event"])
    protected onMousePointer(event: MouseEvent): void {
        if (!this.isDragging && event.type !== "click") {
            return;
        }

        this.selectTime(event.clientX, event.clientY, !this.isDragging);
    }

    @HostListener("touchmove", ["$event"])
    @HostListener("touchend", ["$event"])
    protected onTouchPointer(event: TouchEvent): void {
        const touch = event.changedTouches[0];

        if (!touch) {
            return;
        }

        if (!this.isDragging && event.type !== "touchend") {
            return;
        }

        this.selectTime(touch.clientX, touch.clientY, !this.isDragging);
    }

    protected formatOption(option: ClockFaceOption): string | null {
        if (this.unit() === "minute") {
            const labelGap = getMinuteLabelGap(this.minutesGap(), this.dottedMinutesInGap());

            if (!isMinuteLabelVisible(option.value, labelGap)) {
                return null;
            }

            return option.value.toString().padStart(2, "0");
        }

        return option.value.toString();
    }

    protected isFaceOptionHighlighted(option: ClockFaceOption): boolean {
        if (option.value !== this.selectedValue()) {
            return false;
        }

        if (this.unit() === "minute") {
            const labelGap = getMinuteLabelGap(this.minutesGap(), this.dottedMinutesInGap());

            return isMinuteLabelVisible(option.value, labelGap);
        }

        return true;
    }

    private selectTime(clientX: number, clientY: number, finalizeSelection: boolean): void {
        const clockFaceBounds = this.clockFace().nativeElement.getBoundingClientRect();
        const centerX = clockFaceBounds.left + clockFaceBounds.width / 2;
        const centerY = clockFaceBounds.top + clockFaceBounds.height / 2;
        const arctangent =
            (Math.atan(Math.abs(clientX - centerX) / Math.abs(clientY - centerY)) * 180) / Math.PI;
        const circleAngle = countAngleByCords(centerX, centerY, clientX, clientY, arctangent);
        const angleStep =
            this.unit() === "minute" ? 6 * (this.minutesGap() || 1) : 30;
        const roundedAngle = roundAngle(circleAngle, angleStep);
        const angle = roundedAngle || 360;
        const selectedTime = this.faceTime().find((time) => time.angle === angle);

        if (!selectedTime) {
            return;
        }

        this.timeChange.emit(selectedTime.value);

        if (finalizeSelection) {
            this.timeSelected.emit(selectedTime.value);
        }
    }

    private addTouchEvents(): void {
        const element = this.clockFace().nativeElement;
        this.touchStartHandler = (event: Event) => this.onMouseDown(event as MouseEvent);
        this.touchEndHandler = (event: Event) => this.onMouseUp(event as MouseEvent);

        element.addEventListener("touchstart", this.touchStartHandler, { passive: false });
        element.addEventListener("touchend", this.touchEndHandler);
    }
}

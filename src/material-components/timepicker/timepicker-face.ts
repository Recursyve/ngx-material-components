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

import { ClockFaceOption, DEFAULT_MINUTES_GAP, isMinuteLabelVisible } from "./time-utils";

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
    private touchEndHandler?: () => void;
    private touchStartHandler?: () => void;

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
    @HostListener("touchmove", ["$event.changedTouches[0]"])
    @HostListener("touchend", ["$event.changedTouches[0]"])
    @HostListener("mousemove", ["$event"])
    protected selectTime(event: MouseEvent | Touch): void {
        if (!this.isDragging && event instanceof MouseEvent && event.type !== "click") {
            return;
        }

        const clockFaceBounds = this.clockFace().nativeElement.getBoundingClientRect();
        const centerX = clockFaceBounds.left + clockFaceBounds.width / 2;
        const centerY = clockFaceBounds.top + clockFaceBounds.height / 2;
        const arctangent =
            (Math.atan(Math.abs(event.clientX - centerX) / Math.abs(event.clientY - centerY)) * 180) / Math.PI;
        const circleAngle = countAngleByCords(centerX, centerY, event.clientX, event.clientY, arctangent);
        const angleStep = this.unit() === "minute" ? 6 : 30;
        const roundedAngle = roundAngle(circleAngle, angleStep);
        const angle = roundedAngle || 360;
        const selectedTime = this.faceTime().find((time) => time.angle === angle);

        if (!selectedTime) {
            return;
        }

        this.timeChange.emit(selectedTime.value);

        if (!this.isDragging) {
            this.timeSelected.emit(selectedTime.value);
        }
    }

    protected formatOption(option: ClockFaceOption): string | null {
        if (this.unit() === "minute") {
            if (!isMinuteLabelVisible(option.value, this.minutesGap())) {
                return null;
            }

            return option.value.toString().padStart(2, "0");
        }

        return option.value.toString();
    }

    protected isInvisibleMinuteOption(option: ClockFaceOption): boolean {
        return (
            this.unit() === "minute" &&
            this.dottedMinutesInGap() &&
            !isMinuteLabelVisible(option.value, this.minutesGap())
        );
    }

    protected isFaceOptionHighlighted(option: ClockFaceOption): boolean {
        if (this.unit() === "minute") {
            return option.value === this.selectedValue() && isMinuteLabelVisible(option.value, this.minutesGap());
        }

        return option.value === this.selectedValue();
    }

    protected selectOption(option: ClockFaceOption, event: MouseEvent): void {
        event.stopPropagation();
        this.timeChange.emit(option.value);
        this.timeSelected.emit(option.value);
    }

    private addTouchEvents(): void {
        const element = this.clockFace().nativeElement;
        this.touchStartHandler = () => {
            this.isDragging = true;
        };
        this.touchEndHandler = () => {
            this.isDragging = false;
        };

        element.addEventListener("touchstart", this.touchStartHandler);
        element.addEventListener("touchend", this.touchEndHandler);
    }
}

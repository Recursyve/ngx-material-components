import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    computed,
    ElementRef,
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
    private pointerSelectionSuppressed = false;
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

    public ngAfterViewInit(): void {
        this.addTouchEvents();
    }

    protected onClockFaceMouseDown(event: MouseEvent): void {
        if (this.isFaceInteractiveTarget(event)) {
            return;
        }

        event.preventDefault();
        this.isDragging = true;
    }

    protected onClockFaceMouseUp(event: MouseEvent): void {
        if (!this.isDragging || this.isFaceInteractiveTarget(event)) {
            return;
        }

        event.preventDefault();
        this.isDragging = false;
    }

    protected onClockFaceMouseMove(event: MouseEvent): void {
        if (!this.isDragging || this.isFaceInteractiveTarget(event)) {
            return;
        }

        this.selectTimeFromPointer(event, false);
    }

    protected onClockFaceClick(event: MouseEvent): void {
        if (this.isFaceInteractiveTarget(event) || this.pointerSelectionSuppressed) {
            return;
        }

        this.selectTimeFromPointer(event, true);
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
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        this.isDragging = false;
        this.pointerSelectionSuppressed = true;

        const value =
            this.unit() === "minute" && !isMinuteLabelVisible(option.value, this.minutesGap())
                ? this.snapMinuteToGap(option.value)
                : option.value;

        this.timeChange.emit(value);
        this.timeSelected.emit(value);
        queueMicrotask(() => {
            this.pointerSelectionSuppressed = false;
        });
    }

    protected stopButtonEvent(event: Event): void {
        event.stopPropagation();
        event.stopImmediatePropagation();
    }

    private selectTimeFromPointer(event: MouseEvent | TouchEvent, finalizeSelection: boolean): void {
        const pointer = this.getPointerFromEvent(event);

        if (!pointer) {
            return;
        }
        const clockFaceBounds = this.clockFace().nativeElement.getBoundingClientRect();
        const centerX = clockFaceBounds.left + clockFaceBounds.width / 2;
        const centerY = clockFaceBounds.top + clockFaceBounds.height / 2;
        const arctangent =
            (Math.atan(Math.abs(pointer.clientX - centerX) / Math.abs(pointer.clientY - centerY)) * 180) / Math.PI;
        const circleAngle = countAngleByCords(centerX, centerY, pointer.clientX, pointer.clientY, arctangent);
        const angleStep = this.unit() === "minute" ? 6 : 30;
        const roundedAngle = roundAngle(circleAngle, angleStep);
        const angle = roundedAngle || 360;
        const selectedTime = this.faceTime().find((time) => time.angle === angle);

        if (!selectedTime) {
            return;
        }

        const value =
            this.unit() === "minute"
                ? this.snapMinuteToGap(selectedTime.value)
                : selectedTime.value;

        this.timeChange.emit(value);

        if (finalizeSelection) {
            this.timeSelected.emit(value);
        }
    }

    private snapMinuteToGap(minute: number): number {
        const gap = this.minutesGap();

        if (gap <= 1) {
            return minute;
        }

        return Math.round(minute / gap) * gap % 60;
    }

    private getPointerFromEvent(event: MouseEvent | TouchEvent): PointerPosition | null {
        if (event instanceof MouseEvent) {
            return { clientX: event.clientX, clientY: event.clientY };
        }

        const touch = event.changedTouches[0];

        if (!touch) {
            return null;
        }

        return { clientX: touch.clientX, clientY: touch.clientY };
    }

    private isFaceInteractiveTarget(event: Event): boolean {
        const target = event.target;

        if (!(target instanceof Element)) {
            return false;
        }

        return (
            target.closest(".nice-timepicker-face__button") !== null ||
            target.closest(".clock-face__clock-hand") !== null ||
            target.closest(".clock-face__center") !== null
        );
    }

    private addTouchEvents(): void {
        const element = this.clockFace().nativeElement;
        this.touchStartHandler = (event: Event) => {
            if (!(event instanceof TouchEvent) || this.isFaceInteractiveTarget(event)) {
                return;
            }

            this.isDragging = true;
        };
        this.touchEndHandler = (event: Event) => {
            if (!(event instanceof TouchEvent) || this.isFaceInteractiveTarget(event)) {
                return;
            }

            this.isDragging = false;

            if (this.pointerSelectionSuppressed) {
                return;
            }

            this.selectTimeFromPointer(event, true);
        };

        element.addEventListener("touchstart", this.touchStartHandler, { passive: true });
        element.addEventListener("touchmove", this.onTouchMove, { passive: true });
        element.addEventListener("touchend", this.touchEndHandler);
    }

    private readonly onTouchMove = (event: TouchEvent): void => {
        if (!this.isDragging || this.isFaceInteractiveTarget(event)) {
            return;
        }

        this.selectTimeFromPointer(event, false);
    };
}

type PointerPosition = {
    clientX: number;
    clientY: number;
};

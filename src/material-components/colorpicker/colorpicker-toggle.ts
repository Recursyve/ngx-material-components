import type { ConnectedPosition } from "@angular/cdk/overlay";
import { CdkConnectedOverlay, CdkOverlayOrigin } from "@angular/cdk/overlay";
import { Component, computed, inject, input, signal, ViewEncapsulation } from "@angular/core";
import type { FieldTree } from "@angular/forms/signals";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import type { ColorEvent } from "ngx-color";
import { ColorChromeModule } from "ngx-color/chrome";
import { NICE_COLORPICKER_CONFIG } from "./constant";

@Component({
    selector: "nice-colorpicker-toggle",
    imports: [CdkConnectedOverlay, CdkOverlayOrigin, ColorChromeModule, MatIcon, MatIconButton],
    templateUrl: "./colorpicker-toggle.html",
    styleUrl: "./colorpicker-toggle.scss",
    encapsulation: ViewEncapsulation.None,
    host: {
        class: "nice-colorpicker-toggle"
    }
})
export class NiceColorpickerToggle {
    private readonly config = inject(NICE_COLORPICKER_CONFIG);

    public readonly field = input.required<FieldTree<string>>();

    protected readonly isPickerOpen = signal(false);

    protected readonly overlayPositions: ConnectedPosition[] = [
        {
            originX: "end",
            originY: "bottom",
            overlayX: "end",
            overlayY: "top",
            offsetY: 8
        },
        {
            originX: "end",
            originY: "top",
            overlayX: "end",
            overlayY: "bottom",
            offsetY: -8
        }
    ];

    protected readonly paletteIcon = this.config.paletteIcon;

    protected readonly isDisabled = computed(() => this.field()().disabled());

    protected readonly pickerColor = computed(() => {
        const value = this.field()().value();
        return value || "#000000";
    });

    protected closePicker(): void {
        this.isPickerOpen.set(false);
    }

    protected onPickerChange(event: ColorEvent): void {
        this.field()().value.set(event.color.hex);
    }

    protected togglePicker(event: MouseEvent): void {
        event.stopPropagation();

        if (this.isDisabled()) {
            return;
        }

        this.isPickerOpen.update((open) => !open);
    }
}

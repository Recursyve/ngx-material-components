import type { ConnectedPosition } from "@angular/cdk/overlay";
import { CdkConnectedOverlay, CdkOverlayOrigin } from "@angular/cdk/overlay";
import type { ElementRef } from "@angular/core";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    inject,
    input,
    signal,
    viewChild,
    ViewEncapsulation
} from "@angular/core";
import type { FieldTree } from "@angular/forms/signals";
import { form, FormField } from "@angular/forms/signals";
import { MatIconButton } from "@angular/material/button";
import { MatFormField, MatFormFieldAppearance, MatLabel, MatPrefix, MatSuffix } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { TinyColor } from "@ctrl/tinycolor";
import type { ColorEvent } from "ngx-color";
import { ColorChromeModule } from "ngx-color/chrome";
import { NICE_COLORPICKER_CONFIG } from "./constant";

@Component({
    selector: "nice-colorpicker",
    imports: [
        CdkConnectedOverlay,
        CdkOverlayOrigin,
        ColorChromeModule,
        FormField,
        MatFormField,
        MatIcon,
        MatIconButton,
        MatInput,
        MatLabel,
        MatPrefix,
        MatSuffix
    ],
    templateUrl: "./colorpicker.html",
    styleUrl: "./colorpicker.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class NiceColorpicker {
    private readonly config = inject(NICE_COLORPICKER_CONFIG);

    public readonly appearance = input<MatFormFieldAppearance>();
    public readonly field = input<FieldTree<string>>();
    public readonly label = input.required<string>();

    private readonly textInput = viewChild<ElementRef<HTMLInputElement>>("textInput");

    private readonly fallbackModel = signal("");
    private readonly fallbackForm = form(this.fallbackModel);

    protected readonly isInputFocused = signal(false);
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

    protected readonly isDisabled = computed(() => {
        const field = this.resolvedField();
        return field().disabled();
    });

    protected readonly pickerColor = computed(() => {
        const field = this.resolvedField();
        const value = field().value();
        return value || "#000000";
    });

    protected readonly swatchColor = computed(() => {
        const field = this.resolvedField();
        const value = field().value()?.trim();
        if (!value) {
            return null;
        }

        const color = new TinyColor(value);
        if (!color.isValid) {
            return null;
        }

        return color.toHexString();
    });

    protected readonly showSwatch = computed(() => {
        const field = this.resolvedField();
        const hasValue = !!field().value()?.trim();
        return hasValue || this.isInputFocused();
    });

    protected readonly resolvedAppearance = computed(() => this.appearance() ?? this.config.appearance);
    protected readonly resolvedField = computed(() => this.field() ?? this.fallbackForm);

    protected closePicker(): void {
        this.isPickerOpen.set(false);
    }

    protected onPickerChange(event: ColorEvent): void {
        this.updateFieldValue(event.color.hex);
    }

    protected togglePicker(event: MouseEvent): void {
        event.stopPropagation();

        if (this.isDisabled()) {
            return;
        }

        this.isPickerOpen.update((open) => !open);
    }

    private updateFieldValue(hex: string): void {
        const textInput = this.textInput()?.nativeElement;
        if (!textInput) {
            return;
        }

        textInput.value = hex;
        textInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
}

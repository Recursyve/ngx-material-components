import type { ConnectedPosition } from "@angular/cdk/overlay";
import { CdkConnectedOverlay, CdkOverlayOrigin } from "@angular/cdk/overlay";
import type { ElementRef } from "@angular/core";
import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    signal,
    untracked,
    viewChild,
    ViewEncapsulation
} from "@angular/core";
import type { FieldTree } from "@angular/forms/signals";
import { FormField } from "@angular/forms/signals";
import { MatIconButton } from "@angular/material/button";
import { MatFormFieldControl } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { TinyColor } from "@ctrl/tinycolor";
import type { ColorEvent } from "ngx-color";
import { ColorChromeModule } from "ngx-color/chrome";
import { Subject } from "rxjs";
import { NICE_COLORPICKER_CONFIG } from "./constant";

@Component({
    selector: "nice-colorpicker",
    imports: [
        CdkConnectedOverlay,
        CdkOverlayOrigin,
        ColorChromeModule,
        FormField,
        MatIcon,
        MatIconButton
    ],
    templateUrl: "./colorpicker.html",
    styleUrl: "./colorpicker.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [{ provide: MatFormFieldControl, useExisting: NiceColorpicker }],
    host: {
        class: "nice-colorpicker",
        "[class.nice-colorpicker--focused]": "focused",
        "[class.nice-colorpicker--empty]": "empty",
        "[id]": "id"
    }
})
export class NiceColorpicker implements MatFormFieldControl<string> {
    private static nextId = 0;

    private readonly config = inject(NICE_COLORPICKER_CONFIG);

    public readonly field = input.required<FieldTree<string>>();

    public readonly id = `nice-colorpicker-${NiceColorpicker.nextId++}`;
    public readonly controlType = "nice-colorpicker";
    public readonly stateChanges = new Subject<void>();
    public readonly ngControl = null;
    public readonly placeholder = "";
    public readonly required = false;

    private readonly textInput = viewChild<ElementRef<HTMLInputElement>>("textInput");

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

    protected readonly isDisabled = computed(() => this.field()().disabled());

    protected readonly pickerColor = computed(() => {
        const value = this.field()().value();
        return value || "#000000";
    });

    protected readonly swatchColor = computed(() => {
        const value = this.field()().value()?.trim();
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
        const hasValue = !!this.field()().value()?.trim();
        return hasValue || this.isInputFocused();
    });

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
            this.isPickerOpen();

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

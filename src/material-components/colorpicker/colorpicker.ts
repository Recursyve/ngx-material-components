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
import { MatFormField, MatFormFieldAppearance, MatLabel, MatSuffix } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { NICE_COLORPICKER_CONFIG } from "./constant";

@Component({
    selector: "nice-colorpicker",
    imports: [FormField, MatFormField, MatIcon, MatIconButton, MatInput, MatLabel, MatSuffix],
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

    protected readonly paletteIcon = this.config.paletteIcon;

    protected readonly isDisabled = computed(() => {
        const field = this.resolvedField();
        return field().disabled();
    });

    protected readonly pickerColor = computed(() => {
        const field = this.resolvedField();
        const value = field().value();
        if (this.isHexColor(value)) {
            return value;
        }

        return null;
    });

    protected readonly resolvedAppearance = computed(() => this.appearance() ?? this.config.appearance);
    protected readonly resolvedField = computed(() => this.field() ?? this.fallbackForm);

    protected onColorChange(event: Event): void {
        const textInput = this.textInput()?.nativeElement;
        if (!textInput) {
            return;
        }

        textInput.value = (event.target as HTMLInputElement).value;
        textInput.dispatchEvent(new Event("input", { bubbles: true }));
    }

    protected openColorPicker(colorInput: HTMLInputElement): void {
        if (this.isDisabled()) {
            return;
        }

        colorInput.click();
    }

    private isHexColor(value: string): boolean {
        return /^#[0-9a-fA-F]{6}$/.test(value);
    }
}

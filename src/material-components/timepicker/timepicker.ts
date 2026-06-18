import { ChangeDetectionStrategy, Component, computed, inject, input, signal, ViewEncapsulation } from "@angular/core";
import type { FieldTree } from "@angular/forms/signals";
import { form, FormField } from "@angular/forms/signals";
import { MatButton } from "@angular/material/button";
import { MatDatepickerToggleIcon } from "@angular/material/datepicker";
import { MatFormField, MatFormFieldAppearance, MatLabel, MatSuffix } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { NiceTranslatePipe } from "@recursyve/ngx-material-components/common";
import {
    NgxMatTimepickerComponent,
    NgxMatTimepickerDirective,
    NgxMatTimepickerToggleComponent
} from "ngx-mat-timepicker";
import { NICE_TIMEPICKER_CONFIG } from "./constant";

@Component({
    selector: "nice-timepicker",
    imports: [
        NiceTranslatePipe,
        NgxMatTimepickerToggleComponent,
        NgxMatTimepickerDirective,
        NgxMatTimepickerComponent,
        MatSuffix,
        MatLabel,
        MatInput,
        MatIcon,
        MatFormField,
        MatDatepickerToggleIcon,
        MatButton,
        FormField
    ],
    templateUrl: "./timepicker.html",
    styleUrl: "./timepicker.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None
})
export class NiceTimepicker {
    private readonly config = inject(NICE_TIMEPICKER_CONFIG);

    public readonly appearance = input<MatFormFieldAppearance>();
    public readonly field = input<FieldTree<string>>();
    public readonly label = input.required<string>();

    private readonly fallbackModel = signal("");
    private readonly fallbackForm = form(this.fallbackModel);

    protected readonly toggleIcon = this.config.toggleIcon;
    protected readonly translationKeys = this.config.translationKeys;

    protected readonly resolvedAppearance = computed(() => this.appearance() ?? this.config.appearance);
    protected readonly resolvedField = computed(() => this.field() ?? this.fallbackForm);
}

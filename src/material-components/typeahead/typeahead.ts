import { CdkConnectedOverlay, CdkOverlayOrigin } from "@angular/cdk/overlay";
import { NgTemplateOutlet } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import { MatIconButton } from "@angular/material/button";
import { MatOption } from "@angular/material/core";
import { MatFormField, MatFormFieldControl } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { matSelectAnimations } from "@angular/material/select";
import { NiceTypeaheadBase } from "./typeahead-base";

export type SearchFunction<T> = (search: string, item: T) => boolean;

@Component({
    selector: "nice-typeahead",
    standalone: true,
    imports: [
        CdkOverlayOrigin,
        CdkConnectedOverlay,
        ReactiveFormsModule,
        MatOption,
        MatFormField,
        MatInput,
        MatIconButton,
        NgTemplateOutlet
    ],
    templateUrl: "./typeahead.html",
    styleUrl: "./typeahead.scss",
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    animations: [matSelectAnimations.transformPanel],
    providers: [{ provide: MatFormFieldControl, useExisting: NiceTypeahead }],
    host: {
        "role": "combobox",
        "aria-haspopup": "listbox",
        "class": "nice-typeahead",
        "[attr.id]": "id",
        "[attr.aria-controls]": "panelOpen ? id + \"-panel\" : null",
        "[attr.aria-expanded]": "panelOpen",
        "[attr.aria-required]": "required.toString()",
        "[attr.aria-disabled]": "disabled.toString()",
        "[attr.aria-invalid]": "errorState",
        "[class.nice-typeahead-disabled]": "disabled",
        "[class.nice-typeahead-invalid]": "errorState",
        "[class.nice-typeahead-required]": "required",
        "[class.nice-typeahead-empty]": "empty",
        "(keydown)": "_handleKeydown($event)",
        "(focus)": "onFocusChanged(true)",
        "(blur)": "onFocusChanged(false)"
    }
})
export class NiceTypeahead<T> extends NiceTypeaheadBase<T> {
    public readonly values = input.required<T[]>();
    public readonly searchFn = input<SearchFunction<T>>();

    public readonly filteredValues = computed(() => this.filterValuesFromSearch(this._searchValue(), this.values()));

    public override onFocusChanged(isFocused: boolean): void {
        super.onFocusChanged(isFocused);

        if (isFocused) {
            this._searchControl.patchValue("");
        }
    }

    public filterValuesFromSearch(searchValue: string, values: T[]): T[] {
        if (!searchValue) {
            return values;
        }

        const _searchValue = searchValue.toLowerCase();
        const fn = this.searchFn();
        if (fn) {
            return values.filter((v) => fn(_searchValue, v));
        }

        return values.filter((v) => {
            if (typeof v === "string") {
                return v.toLowerCase().includes(_searchValue);
            }

            const property = this.labelProperty();
            if (!property) {
                return false;
            }

            if (typeof v === "object" && v && property in v) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                return v[property].toString().toLowerCase().includes(_searchValue);
            }

            return false;
        });
    }
}

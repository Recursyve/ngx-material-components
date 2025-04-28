import { JsonPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { MatOption, MatSelect } from "@angular/material/select";
import { NiceFormFieldErrorDirective } from "@recursyve/ngx-material-components/form-field-error";
import { NiceLoadingDirective } from "@recursyve/ngx-material-components/loading";
import {
    NiceAsyncTypeahead,
    NiceTypeahead,
    provideAsyncTypeaheadResources
} from "@recursyve/ngx-material-components/typeahead";
import { ColorsTypeaheadResourceProvider } from "./providers/colors-typeahead-resource.provider";

@Component({
    selector: "nice-root",
    standalone: true,
    imports: [
        MatLabel,
        MatFormField,
        NiceTypeahead,
        MatSelect,
        MatOption,
        MatButton,
        ReactiveFormsModule,
        JsonPipe,
        NiceAsyncTypeahead,
        NiceLoadingDirective,
        NiceFormFieldErrorDirective,
        MatInput
    ],
    templateUrl: "./app.template.html",
    styleUrl: "./app.style.scss",
    providers: [
        provideAsyncTypeaheadResources([ColorsTypeaheadResourceProvider])
    ]
})
export class AppComponent {
    private _fb = inject(FormBuilder);

    public items = ["Apple", "Banana", "Orange", "Pear", "Strawberry"];
    public objectItems = [
        {
            id: 1,
            value: "Apple"
        },
        {
            id: 2,
            value: "Banana"
        },
        {
            id: 3,
            value: "Orange"
        },
        {
            id: 4,
            value: "Pear"
        },
        {
            id: 5,
            value: "Strawberry"
        }
    ];
    public loading = false;

    public formGroup = this._fb.group({
        typeahead: this._fb.control(""),
        asyncTypeahead: this._fb.control(""),
    });

    public formGroupWithErrors = this._fb.group({
        name: this._fb.control("", Validators.required),
        count: this._fb.control(0, [Validators.required, Validators.min(1)]),
    });

    public typeaheadValue = signal({});

    public displayResult(): void {
        this.typeaheadValue.set(this.formGroup.getRawValue());

        this.loading = true;
        setTimeout(() => {
            this.loading = false;
        }, 10000);
    }

    public disableAsyncTypeahead(): void {
        if (this.formGroup.enabled) {
            this.formGroup.disable();
        } else if (this.formGroup.disabled) {
            this.formGroup.enable();
        }
    }
}

import { JsonPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatOption, MatSelect } from "@angular/material/select";
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
        NiceLoadingDirective
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

    public typeaheadValue = signal({});

    public displayResult(): void {
        this.typeaheadValue.set(this.formGroup.getRawValue());

        this.loading = true;
        setTimeout(() => {
            this.loading = false;
        }, 10000);
    }
}

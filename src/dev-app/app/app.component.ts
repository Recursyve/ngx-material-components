import { JsonPipe } from "@angular/common";
import { Component, inject, signal } from "@angular/core";
import { FormBuilder, FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatOption, MatSelect } from "@angular/material/select";
import { NiceTypeaheadComponent } from "@recursyve/ngx-material-components/typeahead";

@Component({
    selector: "nice-root",
    standalone: true,
    imports: [
        MatLabel,
        MatFormField,
        NiceTypeaheadComponent,
        MatSelect,
        MatOption,
        MatButton,
        ReactiveFormsModule,
        JsonPipe
    ],
    templateUrl: "./app.template.html",
    styleUrl: "./app.style.scss"
})
export class AppComponent {
    private _fb = inject(FormBuilder);

    public items = ["Apple", "Banana", "Orange", "Pear", "Strawberry"];
    public formGroup = this._fb.group({
        typeahead: this._fb.control(""),
        asyncTypeahead: this._fb.control(""),
    });

    public typeaheadValue = signal({});

    public displayResult(): void {
        this.typeaheadValue.set(this.formGroup.getRawValue());
    }
}
